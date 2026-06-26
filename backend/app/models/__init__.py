"""
SQLAlchemy models package.

Importing every model here guarantees each class is registered on
``Base.metadata`` before ``Base.metadata.create_all()`` runs in the app
lifespan (see ``app.main``). Without these imports, table creation would
silently depend on route import order.
"""
from app.models.user import User
from app.models.report import Report, ReportVote, ReportCategory, ReportLifecycle
from app.models.journey import Journey, JourneyEvent, JourneyStatus
from app.models.contact import TrustedContact

__all__ = [
    "User",
    "Report",
    "ReportVote",
    "ReportCategory",
    "ReportLifecycle",
    "Journey",
    "JourneyEvent",
    "JourneyStatus",
    "TrustedContact",
]
