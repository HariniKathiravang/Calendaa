from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.session import engine
from app.database.base import Base
from app.config import settings, get_allowed_origins

# Import all models so SQLAlchemy registers them
from app.models import Admin, HOD, Department, Year, Section, Event  # noqa: F401

from app.routes import auth, events, admin, lookup

# Create all tables (idempotent — uses IF NOT EXISTS internally)
Base.metadata.create_all(bind=engine)

# Optionally run idempotent seed to ensure required lookup data exists.
import os

run_seed_flag = os.environ.get("RUN_SEED", "").lower()
if run_seed_flag in ("1", "true", "yes"):
    try:
        from app.seed import seed_all

        print("[INFO] RUN_SEED enabled — running idempotent seed")
        seed_all()
    except Exception:
        # Don't break startup if seeding fails — log for debugging
        import traceback

        print("[WARN] Seeding on startup failed:\n", traceback.format_exc())
else:
    print("[INFO] RUN_SEED not enabled — skipping automatic seeding on startup")

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
    return {"status": "ok", "service": "Calendaa API", "version": "1.0.0"}
