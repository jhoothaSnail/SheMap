from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.journey import JourneyStatus


class JourneyStart(BaseModel):
    origin_lat: float = Field(..., ge=-90, le=90)
    origin_lng: float = Field(..., ge=-180, le=180)
    origin_label: Optional[str] = None
    dest_lat: float = Field(..., ge=-90, le=90)
    dest_lng: float = Field(..., ge=-180, le=180)
    dest_label: Optional[str] = None
    route_type: str = Field(default="safest", pattern="^(safest|fastest|balanced|late_night|emergency)$")
    eta_minutes: Optional[float] = None


class LocationUpdate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class JourneyOut(BaseModel):
    id: str
    user_id: str
    origin_lat: float
    origin_lng: float
    origin_label: Optional[str]
    dest_lat: float
    dest_lng: float
    dest_label: Optional[str]
    route_type: str
    eta_minutes: Optional[float]
    status: JourneyStatus
    deviation_detected: bool
    sos_triggered: bool
    safe_arrival_confirmed: bool
    started_at: datetime
    expected_arrival: Optional[datetime]
    arrived_at: Optional[datetime]

    model_config = {"from_attributes": True}


class JourneyEventOut(BaseModel):
    id: str
    event_type: str
    latitude: Optional[float]
    longitude: Optional[float]
    note: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
