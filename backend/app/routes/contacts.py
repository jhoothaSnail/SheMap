from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.firebase import get_current_user, FirebaseUser
from app.models.contact import TrustedContact
from app.schemas.contact import ContactCreate, ContactUpdate, ContactOut
import uuid

router = APIRouter()


@router.get("/", response_model=list[ContactOut])
def list_contacts(
    current_user: FirebaseUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(TrustedContact)
        .filter(TrustedContact.user_id == current_user.uid)
        .order_by(TrustedContact.priority.asc())
        .all()
    )


@router.post("/", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def add_contact(
    body: ContactCreate,
    current_user: FirebaseUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = db.query(TrustedContact).filter(TrustedContact.user_id == current_user.uid).count()
    if count >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 trusted contacts allowed")

    contact = TrustedContact(
        id=str(uuid.uuid4()),
        user_id=current_user.uid,
        **body.model_dump(),
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.patch("/{contact_id}", response_model=ContactOut)
def update_contact(
    contact_id: str,
    body: ContactUpdate,
    current_user: FirebaseUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = _get_own(contact_id, current_user.uid, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(contact, field, value)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: str,
    current_user: FirebaseUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = _get_own(contact_id, current_user.uid, db)
    db.delete(contact)
    db.commit()


def _get_own(contact_id: str, uid: str, db: Session) -> TrustedContact:
    c = db.query(TrustedContact).filter(TrustedContact.id == contact_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contact not found")
    if c.user_id != uid:
        raise HTTPException(status_code=403, detail="Not your contact")
    return c
