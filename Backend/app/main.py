import os
import traceback

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.session import engine
from app.database.base import Base
from app.config import settings, get_allowed_origins

# Register all models with SQLAlchemy before creating tables
from app.models import Admin, HOD, Department, Year, Section, Event  # noqa: F401
from app.routes import auth, events, admin, lookup

# Create tables (idempotent)
Base.metadata.create_all(bind=engine)

# Run seed only when explicitly opted-in via RUN_SEED env var.
# Set RUN_SEED=1 on first deploy or to refresh lookup data.
if os.environ.get("RUN_SEED", "").lower() in ("1", "true", "yes"):
    try:
        from app.seed import seed_all
        print("[INFO] RUN_SEED=1 — running idempotent seed")
        seed_all()
    except Exception:
        print("[WARN] Seeding failed:\n", traceback.format_exc())

app = FastAPI(
    title="Calendaa API",
    description="Academic Calendar backend — events, departments, HOD management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(admin.router)
app.include_router(lookup.router)


@app.get("/", tags=["Health"])
def health():
    return {
        "status": "ok",
        "service": "Calendaa API",
        "version": "1.0.0",
        "db": settings.DATABASE_URL[:40] + "...",
    }
