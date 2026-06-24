from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SafetyScoreRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_meters: int = Field(default=500, ge=100, le=5000)


class DimensionScores(BaseModel):
    lighting_score: float
    human_presence: float
    isolation_score: float
    crowd_quality: float
    harassment_risk: float
    safe_haven_score: float
    community_trust: float
    weather_risk: float
    night_risk: float


class SafetyScoreOut(BaseModel):
    latitude: float
    longitude: float
    overall_score: float
    confidence_pct: float
    data_points_used: int
    dimensions: DimensionScores
    ai_summary: Optional[str]
    computed_at: datetime


class RouteScoreRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    route_type: str = "safest"
    depart_time: Optional[str] = None   # ISO datetime string


class RouteScoreOut(BaseModel):
    route_type: str
    overall_safety_score: float
    eta_minutes: float
    distance_km: float
    highlights: List[str]
    warnings: List[str]
    ai_explanation: str
    polyline: Optional[str]


class ForecastPoint(BaseModel):
    time_label: str
    hour: int
    predicted_score: float
    level: str          # safe / moderate / risky / unsafe


class SafetyForecastOut(BaseModel):
    latitude: float
    longitude: float
    current_score: float
    forecast: List[ForecastPoint]
    risk_factors: List[dict]
    ai_summary: str


class HeatmapPoint(BaseModel):
    latitude: float
    longitude: float
    weight: float       # 0.0 – 1.0


class HeatmapOut(BaseModel):
    heatmap_type: str
    points: List[HeatmapPoint]
    generated_at: datetime
