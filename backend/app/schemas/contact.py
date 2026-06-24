from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=7, max_length=20)
    email: Optional[str] = None
    relationship_type: Optional[str] = None
    priority: int = Field(default=1, ge=1, le=10)
    notify_on_sos: bool = True
    notify_on_arrival: bool = True
    notify_on_delay: bool = True


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    relationship_type: Optional[str] = None
    priority: Optional[int] = None
    notify_on_sos: Optional[bool] = None
    notify_on_arrival: Optional[bool] = None
    notify_on_delay: Optional[bool] = None


class ContactOut(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str]
    relationship_type: Optional[str]
    priority: int
    notify_on_sos: bool
    notify_on_arrival: bool
    notify_on_delay: bool
    created_at: datetime

    model_config = {"from_attributes": True}
