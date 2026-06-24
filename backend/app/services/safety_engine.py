"""
Safety Scoring Engine
Computes a multi-dimensional safety score for a geographic area
based on community reports, time of day, and static heuristics.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.report import Report, ReportCategory
from app.schemas.safety import DimensionScores, SafetyScoreOut, ForecastPoint, SafetyForecastOut
import math


# ---------------------------------------------------------------------------
# Weight configuration — tweak these for demo tuning
# ---------------------------------------------------------------------------
DIMENSION_WEIGHTS = {
    "lighting_score":   0.15,
    "human_presence":   0.12,
    "isolation_score":  0.12,
    "crowd_quality":    0.10,
    "harassment_risk":  0.18,
    "safe_haven_score": 0.10,
    "community_trust":  0.10,
    "weather_risk":     0.08,
    "night_risk":       0.05,
}

SEVERITY_IMPACT = {1: 5, 2: 12, 3: 22}   # how many points a report deducts


def _nearby_reports(db: Session, lat: float, lng: float, radius_m: int) -> list[Report]:
    """
    Fetch reports within radius_m metres using a fast bounding-box filter.
    (Production: replace with PostGIS ST_DWithin for accuracy.)
    """
    # 1 degree ≈ 111 km
    delta = radius_m / 111_000
    return (
        db.query(Report)
        .filter(
            and_(
                Report.latitude.between(lat - delta, lat + delta),
                Report.longitude.between(lng - delta, lng + delta),
            )
        )
        .all()
    )


def _time_penalty(hour: int) -> float:
    """Returns a safety multiplier based on hour of day (0–23)."""
    if 6 <= hour < 20:
        return 1.0
    if 20 <= hour < 22:
        return 0.88
    if 22 <= hour or hour < 1:
        return 0.72
    return 0.60   # 1–6 AM


def compute_area_score(
    db: Session,
    latitude: float,
    longitude: float,
    radius_meters: int = 500,
) -> SafetyScoreOut:
    reports = _nearby_reports(db, latitude, longitude, radius_meters)
    now = datetime.now(timezone.utc)
    hour = now.hour

    # Base scores — start optimistic, deduct per report
    dims = {
        "lighting_score":   80.0,
        "human_presence":   75.0,
        "isolation_score":  70.0,
        "crowd_quality":    78.0,
        "harassment_risk":  82.0,
        "safe_haven_score": 85.0,
        "community_trust":  80.0,
        "weather_risk":     90.0,
        "night_risk":       75.0,
    }

    for r in reports:
        impact = SEVERITY_IMPACT.get(r.severity, 10)
        # Freshness decay: reports older than 24h have half the impact
        age_hours = (now - r.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600
        decay = 1.0 if age_hours < 24 else 0.5 if age_hours < 72 else 0.25

        effective = impact * decay

        if r.category in (ReportCategory.harassment, ReportCategory.catcalling,
                          ReportCategory.stalking, ReportCategory.following):
            dims["harassment_risk"]  = max(0, dims["harassment_risk"]  - effective)
            dims["crowd_quality"]    = max(0, dims["crowd_quality"]    - effective * 0.5)
        elif r.category == ReportCategory.dark_area:
            dims["lighting_score"]   = max(0, dims["lighting_score"]   - effective)
            dims["isolation_score"]  = max(0, dims["isolation_score"]  - effective * 0.7)
            dims["night_risk"]       = max(0, dims["night_risk"]       - effective * 0.8)
        elif r.category == ReportCategory.broken_streetlight:
            dims["lighting_score"]   = max(0, dims["lighting_score"]   - effective * 0.8)
        elif r.category in (ReportCategory.suspicious_person, ReportCategory.drunk_individuals):
            dims["community_trust"]  = max(0, dims["community_trust"]  - effective)
            dims["crowd_quality"]    = max(0, dims["crowd_quality"]    - effective * 0.6)
        elif r.category == ReportCategory.unsafe_crowd:
            dims["crowd_quality"]    = max(0, dims["crowd_quality"]    - effective)
            dims["human_presence"]   = max(0, dims["human_presence"]   - effective * 0.3)

    # Apply time-of-day multiplier to night-sensitive dimensions
    tm = _time_penalty(hour)
    dims["lighting_score"] *= tm
    dims["isolation_score"] *= tm
    dims["night_risk"] *= tm

    # Weighted overall score
    overall = sum(dims[k] * DIMENSION_WEIGHTS[k] for k in dims) / sum(DIMENSION_WEIGHTS.values())
    overall = round(min(100, max(0, overall)), 1)

    # Confidence: proportional to data volume, capped
    confidence = min(95.0, 40.0 + len(reports) * 3.5)

    return SafetyScoreOut(
        latitude=latitude,
        longitude=longitude,
        overall_score=overall,
        confidence_pct=round(confidence, 1),
        data_points_used=len(reports),
        dimensions=DimensionScores(**{k: round(v, 1) for k, v in dims.items()}),
        ai_summary=None,   # filled in by gemini_service
        computed_at=now,
    )


def compute_forecast(
    db: Session,
    latitude: float,
    longitude: float,
) -> SafetyForecastOut:
    """Generates a 5-point safety forecast for the next 8 hours."""
    base = compute_area_score(db, latitude, longitude)
    now_hour = datetime.now(timezone.utc).hour

    def _level(score: float) -> str:
        if score >= 80: return "safe"
        if score >= 65: return "moderate"
        if score >= 45: return "risky"
        return "unsafe"

    forecast_offsets = [0, 2, 4, 6, 8]
    forecast = []
    for offset in forecast_offsets:
        hour = (now_hour + offset) % 24
        hour_label = f"{hour % 12 or 12} {'AM' if hour < 12 else 'PM'}"
        penalty = _time_penalty(hour)
        score = round(base.overall_score * penalty, 1)
        forecast.append(ForecastPoint(
            time_label=f"+{offset}h" if offset else "Now",
            hour=hour,
            predicted_score=score,
            level=_level(score),
        ))

    risk_factors = []
    if now_hour >= 18:
        risk_factors.append({"icon": "🏪", "label": "Shops Closing", "impact": -12, "time": "9 PM"})
    if now_hour >= 20:
        risk_factors.append({"icon": "👥", "label": "Crowd Reduction", "impact": -18, "time": "10 PM"})
    risk_factors.append({"icon": "🚌", "label": "Transport Schedule", "impact": -14, "time": "11:30 PM"})

    return SafetyForecastOut(
        latitude=latitude,
        longitude=longitude,
        current_score=base.overall_score,
        forecast=forecast,
        risk_factors=risk_factors,
        ai_summary="",  # filled by gemini_service
    )
