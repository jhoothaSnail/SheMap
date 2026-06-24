from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.report import ReportCategory, ReportLifecycle


class ReportCreate(BaseModel):
    category: ReportCategory
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    location_label: Optional[str] = None
    severity: int = Field(default=2, ge=1, le=3)
    media_urls: Optional[List[str]] = None


class ReportOut(BaseModel):
    id: str
    user_id: str
    category: ReportCategory
    title: str
    description: str
    latitude: float
    longitude: float
    location_label: Optional[str]
    severity: int
    trust_score: float
    lifecycle: ReportLifecycle
    is_verified: bool
    upvote_count: int
    downvote_count: int
    media_urls: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ReportFeed(BaseModel):
    """Paginated list of reports with metadata."""
    reports: List[ReportOut]
    total: int
    page: int
    page_size: int


class VoteRequest(BaseModel):
    vote_type: str = Field(..., pattern="^(up|down)$")


class VoteOut(BaseModel):
    report_id: str
    upvote_count: int
    downvote_count: int
    user_vote: Optional[str]   # "up" | "down" | None
