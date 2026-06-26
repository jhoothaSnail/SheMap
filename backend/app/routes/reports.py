from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.core.firebase import get_current_user, FirebaseUser
from app.models.report import Report, ReportVote, ReportCategory, ReportLifecycle
from app.models.user import User
from app.schemas.report import ReportCreate, ReportOut, ReportFeed, VoteRequest, VoteOut
from app.services.report_scorer import update_report_score
import uuid

router = APIRouter()


@router.post("/", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def create_report(
    body: ReportCreate,
    current_user: FirebaseUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user.uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Register first via /auth/register")

    report = Report(
        id=str(uuid.uuid4()),
        user_id=current_user.uid,
        category=body.category,
        title=body.title,
        description=body.description,
        latitude=body.latitude,
        longitude=body.longitude,
        location_label=body.location_label,
        severity=body.severity,
        media_urls=str(body.media_urls) if body.media_urls else None,
    )
    db.add(report)
    db.flush()

    # Compute initial trust score
    update_report_score(report, user, db)

    # Update user stats
    user.reports_submitted += 1
    db.commit()
    db.refresh(report)
    return report


@router.get("/", response_model=ReportFeed)
def list_reports(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    # Up to ~300 km so callers can request district/state-wide feeds
    # (e.g. for Trending/Verified) in addition to tight near-me radii.
    radius_m: int = Query(default=1000, ge=100, le=300000),
    category: Optional[ReportCategory] = None,
    lifecycle: Optional[ReportLifecycle] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Report)

    if lat is not None and lng is not None:
        delta = radius_m / 111_000
        query = query.filter(
            Report.latitude.between(lat - delta, lat + delta),
            Report.longitude.between(lng - delta, lng + delta),
        )
    if category:
        query = query.filter(Report.category == category)
    if lifecycle:
        query = query.filter(Report.lifecycle == lifecycle)

    total = query.count()
    reports = (
        query.order_by(Report.trust_score.desc(), Report.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return ReportFeed(reports=reports, total=total, page=page, page_size=page_size)


@router.get("/trending", response_model=list[ReportOut])
def trending_reports(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    return (
        db.query(Report)
        .filter(Report.lifecycle == ReportLifecycle.trending)
        .order_by(Report.trust_score.desc())
        .limit(limit)
        .all()
    )


@router.get("/{report_id}", response_model=ReportOut)
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/{report_id}/vote", response_model=VoteOut)
def vote_report(
    report_id: str,
    body: VoteRequest,
    current_user: FirebaseUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    existing = db.query(ReportVote).filter(
        ReportVote.report_id == report_id,
        ReportVote.user_id == current_user.uid,
    ).first()

    if existing:
        # Toggle off if same vote
        if existing.vote_type == body.vote_type:
            if body.vote_type == "up":
                report.upvote_count = max(0, report.upvote_count - 1)
            else:
                report.downvote_count = max(0, report.downvote_count - 1)
            db.delete(existing)
            user_vote = None
        else:
            # Switch vote
            if body.vote_type == "up":
                report.upvote_count += 1
                report.downvote_count = max(0, report.downvote_count - 1)
            else:
                report.downvote_count += 1
                report.upvote_count = max(0, report.upvote_count - 1)
            existing.vote_type = body.vote_type
            user_vote = body.vote_type
    else:
        new_vote = ReportVote(
            report_id=report_id,
            user_id=current_user.uid,
            vote_type=body.vote_type,
        )
        db.add(new_vote)
        if body.vote_type == "up":
            report.upvote_count += 1
        else:
            report.downvote_count += 1
        user_vote = body.vote_type

    # Promote to trending if upvotes cross threshold
    if report.upvote_count >= 10 and report.lifecycle == ReportLifecycle.new:
        report.lifecycle = ReportLifecycle.trending

    author = db.query(User).filter(User.id == report.user_id).first()
    update_report_score(report, author, db)
    db.commit()

    return VoteOut(
        report_id=report_id,
        upvote_count=report.upvote_count,
        downvote_count=report.downvote_count,
        user_vote=user_vote,
    )


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: str,
    current_user: FirebaseUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.user_id != current_user.uid:
        raise HTTPException(status_code=403, detail="Not your report")
    db.delete(report)
    db.commit()
