from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app import models  # noqa: F401 — registers all models on Base before create_all
from app.routes import auth, reports, journeys, contacts, safety, sos, maps, track
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="SheMaps API",
    description="Women's Safety Intelligence Network — Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router,     prefix="/api/v1/auth",     tags=["Authentication"])
app.include_router(reports.router,  prefix="/api/v1/reports",  tags=["Reports"])
app.include_router(journeys.router, prefix="/api/v1/journeys", tags=["Journeys"])
app.include_router(contacts.router, prefix="/api/v1/contacts", tags=["Trusted Contacts"])
app.include_router(safety.router,   prefix="/api/v1/safety",   tags=["Safety"])
app.include_router(sos.router,      prefix="/api/v1/sos",       tags=["SOS & Emergency"])
app.include_router(maps.router,     prefix="/api/v1/maps",      tags=["Maps & Routing"])
app.include_router(track.router,    prefix="/api/v1",           tags=["Live Tracking"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "SheMaps API", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
