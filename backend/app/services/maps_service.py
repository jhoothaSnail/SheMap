"""
Maps Service — OpenStreetMap integrations (no API keys required).

We proxy three free OSM services here so the frontend never has to deal with
CORS, rate-limit headers, or User-Agent requirements directly:

- Nominatim  -> geocoding / place search
- OSRM       -> route geometry + alternatives
- Overpass   -> nearby safe spots (police, hospital, pharmacy, etc.)

Every call is defensive: on any network/parse error we return an empty result
(or a documented fallback) so the API stays responsive even if an upstream
OSM service is slow or down.
"""
from __future__ import annotations

import math
from typing import Optional, TypedDict

import requests

# Nominatim's usage policy requires a descriptive, identifying User-Agent.
_USER_AGENT = "SheMap/1.0 (women-safety-app; contact: team@shemap.app)"
_NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
# Photon (komoot) is also OSM-backed but built for type-ahead search. Its
# matching/ranking is far better than Nominatim's for POIs (colleges, shops,
# landmarks), so we use it as the primary geocoder and merge in Nominatim.
_PHOTON_URL = "https://photon.komoot.io/api/"
# Public OSRM only hosts the driving profile. We still ask for alternatives and
# convert the duration to a realistic *walking* ETA downstream, since SheMap is
# a pedestrian safety app.
_OSRM_URL = "https://router.project-osrm.org/route/v1/driving"
_OVERPASS_URL = "https://overpass-api.de/api/interpreter"

_TIMEOUT = 8  # seconds

# Average brisk walking speed (km/h) used to derive pedestrian ETAs.
WALKING_SPEED_KMH = 4.8


# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------
class PlaceResult(TypedDict):
    label: str
    latitude: float
    longitude: float


class RouteResult(TypedDict):
    geometry: list[list[float]]   # [[lat, lng], ...]
    distance_m: float
    duration_s: float


class SafeSpotResult(TypedDict):
    name: str
    type: str
    latitude: float
    longitude: float
    distance_m: float
    open_now: bool


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in metres between two coordinates."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# Nominatim — geocoding / search
# ---------------------------------------------------------------------------
def geocode_search(
    query: str,
    limit: int = 6,
    near_lat: Optional[float] = None,
    near_lng: Optional[float] = None,
) -> list[PlaceResult]:
    """
    Resolve a free-text query into ranked place candidates.

    Strategy: query Photon first (better POI/autocomplete matching) and then
    Nominatim, biasing both to the user's location, and merge the results with
    de-duplication. If either upstream is slow/down we still return whatever the
    other produced, so search degrades gracefully.
    """
    query = (query or "").strip()
    if not query:
        return []

    merged: list[PlaceResult] = []
    seen: set[tuple[float, float]] = set()

    def _add(items: list[PlaceResult]) -> None:
        for it in items:
            # De-dupe by ~11m coordinate cells so the same place from both
            # providers doesn't appear twice.
            key = (round(it["latitude"], 4), round(it["longitude"], 4))
            if key in seen:
                continue
            seen.add(key)
            merged.append(it)

    _add(_photon_search(query, limit, near_lat, near_lng))
    if len(merged) < limit:
        _add(_nominatim_search(query, limit, near_lat, near_lng))

    return merged[:limit]


def _photon_search(
    query: str, limit: int, near_lat: Optional[float], near_lng: Optional[float],
) -> list[PlaceResult]:
    params: dict = {"q": query, "limit": limit, "lang": "en"}
    if near_lat is not None and near_lng is not None:
        params["lat"] = near_lat
        params["lon"] = near_lng

    try:
        resp = requests.get(
            _PHOTON_URL, params=params, headers={"User-Agent": _USER_AGENT}, timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        features = resp.json().get("features", [])
    except (requests.RequestException, ValueError, AttributeError):
        return []

    results: list[PlaceResult] = []
    for feat in features:
        try:
            coords = feat["geometry"]["coordinates"]  # [lng, lat]
            props = feat.get("properties", {})
            bits = [
                props.get("name"),
                props.get("street"),
                props.get("district"),
                props.get("city") or props.get("county"),
                props.get("state"),
                props.get("country"),
            ]
            # Drop blanks and consecutive duplicates for a clean label.
            label_parts: list[str] = []
            for b in bits:
                if b and (not label_parts or label_parts[-1] != b):
                    label_parts.append(b)
            results.append(
                PlaceResult(
                    label=", ".join(label_parts) or query,
                    latitude=float(coords[1]),
                    longitude=float(coords[0]),
                )
            )
        except (KeyError, IndexError, ValueError, TypeError):
            continue
    return results


def _nominatim_search(
    query: str, limit: int, near_lat: Optional[float], near_lng: Optional[float],
) -> list[PlaceResult]:
    params: dict = {"q": query, "format": "jsonv2", "limit": limit, "addressdetails": 0}
    if near_lat is not None and near_lng is not None:
        # ~0.6 degree box (~65 km) around the user, preferred but not enforced.
        d = 0.6
        params["viewbox"] = f"{near_lng - d},{near_lat + d},{near_lng + d},{near_lat - d}"
        params["bounded"] = 0

    try:
        resp = requests.get(
            _NOMINATIM_URL,
            params=params,
            headers={"User-Agent": _USER_AGENT},
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
    except (requests.RequestException, ValueError):
        return []

    results: list[PlaceResult] = []
    for item in data:
        try:
            results.append(
                PlaceResult(
                    label=item.get("display_name", ""),
                    latitude=float(item["lat"]),
                    longitude=float(item["lon"]),
                )
            )
        except (KeyError, ValueError, TypeError):
            continue
    return results


# ---------------------------------------------------------------------------
# OSRM — routing with alternatives
# ---------------------------------------------------------------------------
def get_route_alternatives(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> list[RouteResult]:
    """
    Fetch route geometry (and alternatives) between two points.

    OSRM expects coordinates as lng,lat. We convert the returned GeoJSON
    geometry back to [lat, lng] pairs for Leaflet.
    """
    coords = f"{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
    try:
        resp = requests.get(
            f"{_OSRM_URL}/{coords}",
            params={
                # Request up to 3 alternative routes so the safety engine has
                # several corridors to compare and rank.
                "alternatives": "3",
                "overview": "full",
                "geometries": "geojson",
                "steps": "false",
            },
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
    except (requests.RequestException, ValueError):
        return []

    if data.get("code") != "Ok":
        return []

    routes: list[RouteResult] = []
    for route in data.get("routes", []):
        try:
            geo = route["geometry"]["coordinates"]  # [[lng, lat], ...]
            latlng = [[float(c[1]), float(c[0])] for c in geo]
            routes.append(
                RouteResult(
                    geometry=latlng,
                    distance_m=float(route.get("distance", 0.0)),
                    duration_s=float(route.get("duration", 0.0)),
                )
            )
        except (KeyError, ValueError, TypeError, IndexError):
            continue
    return routes


# ---------------------------------------------------------------------------
# Overpass — nearby safe spots
# ---------------------------------------------------------------------------
# Maps an OSM tag to a friendly safe-spot type used by the frontend.
_SAFE_SPOT_QUERIES = [
    ('node["amenity"="police"]', "police"),
    ('node["amenity"="hospital"]', "hospital"),
    ('node["amenity"="pharmacy"]', "pharmacy"),
    ('node["amenity"="fuel"]', "petrol"),
    ('node["shop"="convenience"]', "store"),
]


def find_safe_spots(
    lat: float,
    lng: float,
    radius_m: int = 1000,
) -> Optional[list[SafeSpotResult]]:
    """
    Query Overpass for nearby safe spots (police, hospital, pharmacy, fuel,
    convenience stores).

    Returns ``None`` on failure so callers can fall back to mock data.
    """
    blocks = "\n".join(
        f'{tag}(around:{radius_m},{lat},{lng});' for tag, _ in _SAFE_SPOT_QUERIES
    )
    query = f"[out:json][timeout:25];({blocks});out body 40;"

    try:
        resp = requests.post(
            _OVERPASS_URL,
            data={"data": query},
            headers={"User-Agent": _USER_AGENT},
            timeout=_TIMEOUT * 3,  # Overpass can be slow
        )
        resp.raise_for_status()
        data = resp.json()
    except (requests.RequestException, ValueError):
        return None

    def _classify(tags: dict) -> str:
        if tags.get("amenity") == "police":
            return "police"
        if tags.get("amenity") == "hospital":
            return "hospital"
        if tags.get("amenity") == "pharmacy":
            return "pharmacy"
        if tags.get("amenity") == "fuel":
            return "petrol"
        if tags.get("shop") == "convenience":
            return "store"
        return "safe_spot"

    results: list[SafeSpotResult] = []
    for el in data.get("elements", []):
        try:
            slat = float(el["lat"])
            slng = float(el["lon"])
        except (KeyError, ValueError, TypeError):
            continue
        tags = el.get("tags", {}) or {}
        spot_type = _classify(tags)
        name = tags.get("name") or spot_type.replace("_", " ").title()
        results.append(
            SafeSpotResult(
                name=name,
                type=spot_type,
                latitude=slat,
                longitude=slng,
                distance_m=round(haversine_m(lat, lng, slat, slng)),
                open_now=True,  # Overpass rarely exposes live hours
            )
        )

    results.sort(key=lambda s: s["distance_m"])
    return results
