"""
Report Ranking Engine
Implements the formula:
  trust_score = freshness_score + upvotes - downvotes + user_credibility + severity_weight

Higher score = shown first in community feed.
"""
from datetime import datetime, timezone
from app.models.report import Report
from app.models.user import User


SEVERITY_WEIGHT = {1: 2, 2: 5, 3: 10}


def compute_trust_score(report: Report, author: User | None) -> float:
    now = datetime.now(timezone.utc)
    age_hours = (now - report.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600

    # Freshness: full weight for first 6h, linear decay to 0 at 7 days
    freshness = max(0, 50 - (age_hours / 168) * 50)

    net_votes = report.upvote_count - report.downvote_count

    user_credibility = (author.trust_score * 10) if author else 0

    severity = SEVERITY_WEIGHT.get(report.severity, 5)

    score = freshness + net_votes * 2 + user_credibility + severity

    # Verified reports get a bonus
    if report.is_verified:
        score += 15

    return round(max(0, score), 2)


def update_report_score(report: Report, author: User | None, db) -> None:
    report.trust_score = compute_trust_score(report, author)
    db.add(report)
    db.commit()
