import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class AreaSafetyScore(Base):
    """
    Cached safety score for a geographic cell (H3 or simple lat/lng grid).
    Recomputed periodically by the scoring engine.
    """
    __tablename__ = "area_safety_scores"

    id        = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    cell_key  = Column(String(50), unique=True, nullable=False)  # e.g. "lat_lng_zoom"

    latitude  = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Dimension scores (0–100)
    lighting_score      = Column(Float, default=50.0)
    human_presence      = Column(Float, default=50.0)
    isolation_score     = Column(Float, default=50.0)
    crowd_quality       = Column(Float, default=50.0)
    harassment_risk     = Column(Float, default=50.0)
    safe_haven_score    = Column(Float, default=50.0)
    community_trust     = Column(Float, default=50.0)
    weather_risk        = Column(Float, default=50.0)
    night_risk          = Column(Float, default=50.0)

    # Composite
    overall_score       = Column(Float, default=50.0)
    confidence_pct      = Column(Float, default=0.0)
    data_points_used    = Column(Integer, default=0)

    # AI explanation
    ai_summary          = Column(Text, nullable=True)

    computed_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())
