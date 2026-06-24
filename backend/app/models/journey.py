import uuid
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class JourneyStatus(str, enum.Enum):
    active      = "active"
    delayed     = "delayed"
    interrupted = "interrupted"
    completed   = "completed"
    sos_active  = "sos_active"


class Journey(Base):
    __tablename__ = "journeys"

    id      = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Route info
    origin_lat       = Column(Float, nullable=False)
    origin_lng       = Column(Float, nullable=False)
    origin_label     = Column(String(300), nullable=True)
    dest_lat         = Column(Float, nullable=False)
    dest_lng         = Column(Float, nullable=False)
    dest_label       = Column(String(300), nullable=True)
    route_polyline   = Column(Text, nullable=True)       # encoded polyline from Google
    route_type       = Column(String(50), default="safest")  # safest/fastest/balanced

    # ETA & timing
    eta_minutes      = Column(Float, nullable=True)
    started_at       = Column(DateTime(timezone=True), server_default=func.now())
    expected_arrival = Column(DateTime(timezone=True), nullable=True)
    arrived_at       = Column(DateTime(timezone=True), nullable=True)

    # State
    status               = Column(SAEnum(JourneyStatus), default=JourneyStatus.active)
    deviation_detected   = Column(Boolean, default=False)
    sos_triggered        = Column(Boolean, default=False)
    safe_arrival_confirmed = Column(Boolean, default=False)

    # Scores
    safety_score_at_start = Column(Float, nullable=True)

    user   = relationship("User",          back_populates="journeys")
    events = relationship("JourneyEvent",  back_populates="journey", cascade="all, delete-orphan")


class JourneyEvent(Base):
    __tablename__ = "journey_events"

    id         = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    journey_id = Column(String, ForeignKey("journeys.id"), nullable=False)

    event_type = Column(String(50), nullable=False)   # location_update | deviation | sos | arrival
    latitude   = Column(Float, nullable=True)
    longitude  = Column(Float, nullable=True)
    note       = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    journey = relationship("Journey", back_populates="events")
