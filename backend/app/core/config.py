from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/shemap"

    # Firebase (used for token verification)
    FIREBASE_PROJECT_ID: str = ""

    FIREBASE_CREDENTIALS_PATH: str = "./firebase-credentials.json"

    # Gemini AI
    GEMINI_API_KEY: str = ""
    
    # App
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-this-in-production"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "capacitor://localhost",
        "http://localhost",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
