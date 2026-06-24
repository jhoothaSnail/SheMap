from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.core.firebase import get_current_user, FirebaseUser
from app.models.journey import Journey, JourneyEvent, JourneyStatus
from app.models.user import User
from app.schemas.journey import JourneyStart, JourneyOut, JourneyEventOut, LocationUpdate
from app.services.safety_engine import compute_area_score
import uuid

router = APIRouter()


@router.post("/start", response_model=JourneyOut, status_code=status.HTTP_201_CREATED)
def start_journey(
    body: JourneyStart,
    current_user: FirebaseUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Close any existing active journey first
    active = db.query(Journey).filter(
        Journey.user_id == current_user.uid,
        Journey.status == JourneyStatus.active,
    ).first()
    if active:
        active.status = JourneyStatus.interrupted
        db.add(active)

    safety = compute_area_score(db, body.origin_lat, body.origin_lng)
    eta = body.eta_minutes or 20.0

    journey = Journey(
        id=str(uuid.uuid4()),
        user_id=current_user.uid,
        origin_lat=body.origin_lat,
        origin_lng=body.origin_lng,
        origin_label=body.origin_label,
        dest_lat=body.dest_lat,
        dest_lng=body.dest_lng,
        dest_label=body.dest_label,
        route_type=body.route_type,
        eta_minutes=eta,
        expected_arrival=datetime.now(timezone.utc) + timedelta(minutes=eta),
        safety_score_at_start=safety.overall_score,
    )
    db.add(journey)

    event = JourneyEvent(
        id=str(uuid.uuid4()),
        journey_id=journey.id,
        event_type="journey_started",
        latitude=body.origin_lat,
        longitude=body.origin_lng,
        note=f"Route: {body.route_type}, ETA: {eta} min",
    )
    db.add(event)
    db.commit()
    db.refresh(journey)
    return journey


@router.post("/{journey_id}/location", response_model=JourneyEventOut)
def update_location(
    journey_id: str,
    body: LocationUpdate,
    current_user: FirebaseUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    journey = _get_own_journey(journey_id, current_user.uid, db)

    # Simple deviation check: if >500m from destination bearing, flag it
    # (Production: compare against route polyline)
    event_type = "location_update"
    note = None

    dist_to_dest = _haversine(
        body.latitude, body.longitude,
        journey.dest_lat, journey.dest_lng,
    )
    if dist_to_dest > 2000 and not journey.deviation_detected:
        journey.deviation_detected = True
        event_type = "deviation_detected"
        note = f"Distance to destination: {dist_to_dest:.0f}m — possible deviation"
        db.add(journey)

    event = JourneyEvent(
        id=str(uuid.uuid4()),
        journey_id=journey_id,
        event_type=event_type,
        latitude=body.latitude,
        longitude=body.longitude,
        note=note,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.post("/{journey_id}/arrive", response_model=JourneyOut)
def confirm_arrival(
    journey_id: str,
    current_user: FirebaseUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    journey = _get_own_journey(journey_id, current_user.uid, db)
    journey.status = JourneyStatus.completed
    journey.safe_arrival_confirmed = True
    journey.arrived_at = datetime.now(timezone.utc)

    event = JourneyEvent(
        id=str(uuid.uuid4()),
        journey_id=journey_id,
        event_type="safe_arrival",
        note="User confirmed safe arrival",
    )
    db.add(event)

    user = db.query(User).filter(User.id == current_user.uid).first()
    if user:
        user.community_impact += 1
    db.commit()
    db.refresh(journey)
    return journey


@router.get("/active", response_model=JourneyOut)
def get_active_journey(
    current_user: FirebaseUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    journey = db.query(Journey).filter(
        Journey.user_id == current_user.uid,
        Journey.status == JourneyStatus.active,
    ).first()
    if not journey:
        raise HTTPException(status_code=404, detail="No active journey")
    return journey


@router.get("/history", response_model=list[JourneyOut])
def journey_history(
    current_user: FirebaseUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Journey)
        .filter(Journey.user_id == current_user.uid)
        .order_by(Journey.started_at.desc())
        .limit(50)
        .all()
    )


@router.get("/{journey_id}/events", response_model=list[JourneyEventOut])
def journey_events(
    journey_id: str,
    current_user: FirebaseUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_own_journey(journey_id, current_user.uid, db)
    return (
        db.query(JourneyEvent)
        .filter(JourneyEvent.journey_id == journey_id)
        .order_by(JourneyEvent.created_at.asc())
        .all()
    )


# --- helpers ---

def _get_own_journey(journey_id: str, uid: str, db: Session) -> Journey:
    j = db.query(Journey).filter(Journey.id == journey_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Journey not found")
    if j.user_id != uid:
        raise HTTPException(status_code=403, detail="Not your journey")
    return j


def _haversine(lat1, lon1, lat2, lon2) -> float:
    """Distance in metres between two lat/lng points."""
    R = 6_371_000
    import math
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
