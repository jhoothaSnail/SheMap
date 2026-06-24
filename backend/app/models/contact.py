import uuid
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class TrustedContact(Base):
    __tablename__ = "trusted_contacts"

    id           = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id      = Column(String, ForeignKey("users.id"), nullable=False)

    name         = Column(String(100), nullable=False)
    phone        = Column(String(20),  nullable=False)
    email        = Column(String(200), nullable=True)
    relationship_type = Column(String(50), nullable=True)   # mother/friend/sister/etc.

    priority     = Column(Integer, default=1)               # alert order
    notify_on_sos     = Column(Boolean, default=True)
    notify_on_arrival = Column(Boolean, default=True)
    notify_on_delay   = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="trusted_contacts")
