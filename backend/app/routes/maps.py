"""
Maps Routes — OpenStreetMap-backed search, routing, and safe spots.

These endpoints proxy the free OSM services implemented in
``app.services.maps_service`` and layer SheMap's safety intelligence on top:
``/safe-routes`` scores every OSRM alternative through the safety engine and
recommends the safest one (not merely the fastest).
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.services import maps_service
from app.services.safety_engine import compute_area_score
from app.services.gemini_service import explain_route_safety

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class PlaceOut(BaseModel):
    label: str
    latitude: float
    longitude: float


class ScoredRouteOut(BaseModel):
    index: int
    geometry: list[list[float]]          # [[lat, lng], ...]
    distance_km: float
    eta_minutes: float
    safety_score: float
    level: str                           # safe / moderate / risky / unsafe
    recommended: bool
    ai_explanation: Optional[str] = None


class SafeRoutesOut(BaseModel):
    origin: list[float]                  # [lat, lng]
    destination: list[float]             # [lat, lng]
    routes: list[ScoredRouteOut]


class SafeSpotOut(BaseModel):
    name: str
    type: str
    latitude: float
    longitude: float
    distance_m: float
    open_now: bool


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _level(score: float) -> str:
    if score >= 80:
        return "safe"
    if score >= 65:
        return "moderate"
    if score >= 45:
        return "risky"
    return "unsafe"


def _sample(geometry: list[list[float]], steps: int = 5) -> list[tuple[float, float]]:
    """Pick up to ``steps`` evenly-spaced points along a route geometry."""
    if not geometry:
        return []
    if len(geometry) <= steps:
        return [(p[0], p[1]) for p in geometry]
    stride = (len(geometry) - 1) / (steps - 1)
    return [
        (geometry[round(i * stride)][0], geometry[round(i * stride)][1])
        for i in range(steps)
    ]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get("/search", response_model=list[PlaceOut])
def search_places(
    q: str = Query(..., min_length=2),
    limit: int = Query(default=6, ge=1, le=10),
    lat: Optional[float] = Query(None, ge=-90, le=90),
    lng: Optional[float] = Query(None, ge=-180, le=180),
):
    """Free-text place search via Nominatim, biased toward the user's location."""
    return [PlaceOut(**p) for p in maps_service.geocode_search(q, limit, lat, lng)]


@router.get("/safe-routes", response_model=SafeRoutesOut)
def safe_routes(
    origin_lat: float = Query(..., ge=-90, le=90),
    origin_lng: float = Query(..., ge=-180, le=180),
    dest_lat: float = Query(..., ge=-90, le=90),
    dest_lng: float = Query(..., ge=-180, le=180),
    db: Session = Depends(get_db),
):
    """
    Fetch OSRM route alternatives, score each via the safety engine, and
    recommend the safest. The recommended route also gets a Gemini explanation.
    """
    raw_routes = maps_service.get_route_alternatives(
        origin_lat, origin_lng, dest_lat, dest_lng
    )

    scored: list[ScoredRouteOut] = []
    for idx, r in enumerate(raw_routes):
        waypoints = _sample(r["geometry"], steps=7)
        if waypoints:
            scores = [compute_area_score(db, lat, lng).overall_score for lat, lng in waypoints]
            safety = round(sum(scores) / len(scores), 1)
        else:
            safety = 0.0
        distance_km = round(r["distance_m"] / 1000, 2)
        # Public OSRM returns a *driving* duration; convert distance to a
        # realistic pedestrian ETA instead, since SheMap users are on foot.
        eta_minutes = round((distance_km / maps_service.WALKING_SPEED_KMH) * 60, 1)
        scored.append(
            ScoredRouteOut(
                index=idx,
                geometry=r["geometry"],
                distance_km=distance_km,
                eta_minutes=eta_minutes,
                safety_score=safety,
                level=_level(safety),
                recommended=False,
            )
        )

    # Rank: safest first, then shortest as a tie-breaker.
    scored.sort(key=lambda s: (-s.safety_score, s.distance_km))
    if scored:
        scored[0].recommended = True
        scored[0].ai_explanation = explain_route_safety(
            route_type="safest",
            safety_score=scored[0].safety_score,
            eta_minutes=scored[0].eta_minutes,
            highlights=["Highest safety score among available routes"],
            warnings=[] if scored[0].safety_score >= 65 else ["Limited safe options on this trip"],
        )

    return SafeRoutesOut(
        origin=[origin_lat, origin_lng],
        destination=[dest_lat, dest_lng],
        routes=scored,
    )


@router.get("/safe-spots", response_model=list[SafeSpotOut])
def safe_spots(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_m: int = Query(default=1000, ge=100, le=5000),
):
    """Nearby safe spots (police, hospital, pharmacy, fuel, stores) via Overpass."""
    spots = maps_service.find_safe_spots(lat, lng, radius_m)
    if not spots:
        return []
    return [SafeSpotOut(**s) for s in spots]
