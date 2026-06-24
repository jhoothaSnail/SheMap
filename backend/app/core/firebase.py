"""
Firebase Admin SDK — verifies ID tokens from frontend.
The frontend sends: Authorization: Bearer <firebase_id_token>
We verify it here and extract the uid + email.
"""
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
import os

_firebase_initialized = False


def _init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return
    # In production: use a service account JSON file.
    # In development: use GOOGLE_APPLICATION_CREDENTIALS env var or inline creds.
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    else:
        # Fallback: application default credentials (works on GCP / Cloud Run)
        firebase_admin.initialize_app()
    _firebase_initialized = True


security = HTTPBearer()


class FirebaseUser:
    def __init__(self, uid: str, email: str | None):
        self.uid = uid
        self.email = email


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> FirebaseUser:
    """FastAPI dependency — verifies the Firebase ID token and returns the user."""
    _init_firebase()
    token = credentials.credentials
    try:
        decoded = firebase_auth.verify_id_token(token)
        return FirebaseUser(uid=decoded["uid"], email=decoded.get("email"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token",
        )
