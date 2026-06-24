import uuid
from sqlalchemy import (
    Column, String, Float, Integer, Boolean,
    DateTime, Text, ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class ReportCategory(str, enum.Enum):
    harassment       = "harassment"
    catcalling       = "catcalling"
    following        = "following"
    stalking         = "stalking"
    unsafe_crowd     = "unsafe_crowd"
    dark_area        = "dark_area"
    broken_streetlight = "broken_streetlight"
    suspicious_person = "suspicious_person"
    unsafe_shortcut  = "unsafe_shortcut"
    drunk_individuals = "drunk_individuals"


class ReportLifecycle(str, enum.Enum):
    new      = "new"
    verified = "verified"
    trending = "trending"
    resolved = "resolved"
    archived = "archived"


class Report(Base):
    __tablename__ = "reports"

    id          = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id     = Column(String, ForeignKey("users.id"), nullable=False)

    category    = Column(SAEnum(ReportCategory), nullable=False)
    title       = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)

    # Location
    latitude    = Column(Float, nullable=False)
    longitude   = Column(Float, nullable=False)
    location_label = Column(String(300), nullable=True)  # human-readable address

    # Scoring
    severity    = Column(Integer, default=2)             # 1=low 2=moderate 3=high
    trust_score = Column(Float, default=0.0)             # computed ranking score

    # State
    lifecycle   = Column(SAEnum(ReportLifecycle), default=ReportLifecycle.new)
    is_verified = Column(Boolean, default=False)
    media_urls  = Column(Text, nullable=True)            # JSON array of Firebase Storage URLs

    # Aggregated vote counts (denormalised for fast reads)
    upvote_count   = Column(Integer, default=0)
    downvote_count = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    author = relationship("User", back_populates="reports")
    votes  = relationship("ReportVote", back_populates="report", cascade="all, delete-orphan")


class ReportVote(Base):
    __tablename__ = "report_votes"

    id        = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("reports.id"), nullable=False)
    user_id   = Column(String, ForeignKey("users.id"),   nullable=False)
    vote_type = Column(String(10), nullable=False)       # "up" | "down"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship("Report", back_populates="votes")
    user   = relationship("User",   back_populates="votes")
