from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    """Called after Firebase signup — registers user in our DB."""
    email: Optional[str] = None
    display_name: Optional[str] = None
    photo_url: Optional[str] = None


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    home_address: Optional[str] = None
    work_address: Optional[str] = None
    college_address: Optional[str] = None
    hostel_address: Optional[str] = None


class UserOut(BaseModel):
    id: str
    email: Optional[str]
    display_name: Optional[str]
    photo_url: Optional[str]
    trust_score: float
    reports_submitted: int
    verified_reports: int
    upvotes_received: int
    community_impact: int
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfileOut(UserOut):
    home_address: Optional[str]
    work_address: Optional[str]
    college_address: Optional[str]
    hostel_address: Optional[str]
