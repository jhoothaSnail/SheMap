"""
Auth Routes
Firebase handles the actual login/signup flow.
These endpoints sync the Firebase user into our PostgreSQL users table.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.firebase import get_current_user, FirebaseUser
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserProfileOut, UserUpdate

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(
    body: UserCreate,
    current_user: FirebaseUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Called once after Firebase signup.
    Creates the user row in PostgreSQL using their Firebase UID as primary key.
    """
    existing = db.query(User).filter(User.id == current_user.uid).first()
    if existing:
        return existing   # idempotent — safe to call multiple times

    user = User(
        id=current_user.uid,
        email=body.email or current_user.email,
        display_name=body.display_name,
        photo_url=body.photo_url,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserProfileOut)
def get_me(
    current_user: FirebaseUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user.uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Call /register first.")
    return user


@router.patch("/me", response_model=UserOut)
def update_profile(
    body: UserUpdate,
    current_user: FirebaseUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user.uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user
