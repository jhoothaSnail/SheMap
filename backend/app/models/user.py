from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id          = Column(String, primary_key=True)          # Firebase UID
    email       = Column(String, unique=True, nullable=True)
    display_name = Column(String, nullable=True)
    photo_url   = Column(String, nullable=True)

    # Reputation
    trust_score      = Column(Float, default=0.0)
    reports_submitted = Column(Integer, default=0)
    verified_reports  = Column(Integer, default=0)
    upvotes_received  = Column(Integer, default=0)
    community_impact  = Column(Integer, default=0)

    # Preferences
    is_active        = Column(Boolean, default=True)
    home_address     = Column(Text, nullable=True)
    work_address     = Column(Text, nullable=True)
    college_address  = Column(Text, nullable=True)
    hostel_address   = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    reports         = relationship("Report", back_populates="author", cascade="all, delete-orphan")
    journeys        = relationship("Journey", back_populates="user",  cascade="all, delete-orphan")
    trusted_contacts = relationship("TrustedContact", back_populates="user", cascade="all, delete-orphan")
    votes           = relationship("ReportVote", back_populates="user", cascade="all, delete-orphan")
