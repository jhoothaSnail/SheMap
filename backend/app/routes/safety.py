from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.services.safety_engine import compute_area_score, compute_forecast
from app.services.gemini_service import (
    explain_area_safety,
    generate_forecast_summary,
)
from app.schemas.safety import (
    SafetyScoreOut,
    SafetyForecastOut,
    HeatmapOut,
    HeatmapPoint,
    RouteScoreRequest,
    RouteScoreOut,
)
from app.models.report import Report
import math

router = APIRouter()


@router.get("/score", response_model=SafetyScoreOut)
def area_safety_score(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_m: int = Query(default=500, ge=100, le=5000),
    db: Session = Depends(get_db),
):
    result = compute_area_score(db, lat, lng, radius_m)

    # Enrich with Gemini explanation
    dims_dict = result.dimensions.model_dump()
    result.ai_summary = explain_area_safety(
        overall_score=result.overall_score,
        dimensions=dims_dict,
        report_count=result.data_points_used,
        hour=datetime.now(timezone.utc).hour,
    )
    return result


@router.get("/forecast", response_model=SafetyForecastOut)
def safety_forecast(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    db: Session = Depends(get_db),
):
    result = compute_forecast(db, lat, lng)
    result.ai_summary = generate_forecast_summary(
        current_score=result.current_score,
        forecast=[f.model_dump() for f in result.forecast],
        risk_factors=result.risk_factors,
    )
    return result


@router.post("/route-score", response_model=RouteScoreOut)
def score_route(body: RouteScoreRequest, db: Session = Depends(get_db)):
    """Score a route by averaging safety of waypoints along it."""
    # Sample 5 intermediate points between origin and destination
    waypoints = _interpolate(
        body.origin_lat, body.origin_lng,
        body.dest_lat, body.dest_lng,
        steps=5,
    )
    scores = [compute_area_score(db, lat, lng).overall_score for lat, lng in waypoints]
    avg_score = round(sum(scores) / len(scores), 1)

    dist_km = round(
        _haversine(body.origin_lat, body.origin_lng, body.dest_lat, body.dest_lng) / 1000,
        2,
    )

    route_etas = {"safest": dist_km * 14, "fastest": dist_km * 8, "balanced": dist_km * 11}
    eta = round(route_etas.get(body.route_type, dist_km * 12), 1)

    highlights, warnings = _derive_highlights(avg_score, body.route_type)

    from app.services.gemini_service import explain_route_safety
    explanation = explain_route_safety(body.route_type, avg_score, eta, highlights, warnings)

    return RouteScoreOut(
        route_type=body.route_type,
        overall_safety_score=avg_score,
        eta_minutes=eta,
        distance_km=dist_km,
        highlights=highlights,
        warnings=warnings,
        ai_explanation=explanation,
        polyline=None,
    )


@router.get("/heatmap", response_model=HeatmapOut)
def get_heatmap(
    lat: float = Query(...),
    lng: float = Query(...),
    heatmap_type: str = Query(default="harassment"),
    radius_m: int = Query(default=2000),
    db: Session = Depends(get_db),
):
    from app.models.report import ReportCategory
    category_map = {
        "harassment": [ReportCategory.harassment, ReportCategory.catcalling,
                       ReportCategory.stalking, ReportCategory.following],
        "dark_zones": [ReportCategory.dark_area, ReportCategory.broken_streetlight],
        "unsafe":     [ReportCategory.unsafe_crowd, ReportCategory.suspicious_person,
                       ReportCategory.drunk_individuals, ReportCategory.unsafe_shortcut],
    }
    categories = category_map.get(heatmap_type, list(ReportCategory))

    delta = radius_m / 111_000
    reports = (
        db.query(Report)
        .filter(
            Report.category.in_(categories),
            Report.latitude.between(lat - delta, lat + delta),
            Report.longitude.between(lng - delta, lng + delta),
        )
        .all()
    )

    points = [
        HeatmapPoint(
            latitude=r.latitude,
            longitude=r.longitude,
            weight=min(1.0, r.severity / 3.0 * (1 + r.upvote_count * 0.05)),
        )
        for r in reports
    ]

    return HeatmapOut(
        heatmap_type=heatmap_type,
        points=points,
        generated_at=datetime.now(timezone.utc),
    )


# --- helpers ---

def _interpolate(lat1, lng1, lat2, lng2, steps=5):
    return [
        (lat1 + (lat2 - lat1) * i / (steps - 1),
         lng1 + (lng2 - lng1) * i / (steps - 1))
        for i in range(steps)
    ]


def _haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _derive_highlights(score: float, route_type: str):
    highlights, warnings = [], []
    if score >= 80:
        highlights += ["Well-lit streets", "High community trust"]
    elif score >= 65:
        highlights += ["Moderate foot traffic"]
        warnings += ["Some low-light sections"]
    else:
        warnings += ["Low safety score", "Recent incidents reported"]
    if route_type == "safest":
        highlights.append("Maximises safe havens nearby")
    if route_type == "fastest":
        warnings.append("Speed prioritised over safety")
    return highlights, warnings
