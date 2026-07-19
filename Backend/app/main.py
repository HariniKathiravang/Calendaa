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

app = FastAPI(
    title="Calendaa API",
    description="Academic Calendar backend — events, departments, HOD management",
    version="1.0.0",
    # Swagger accessible locally at /api/docs
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS — only needed for local dev (frontend on :8081, backend on :8000).
# In the combined Vercel deployment everything is same-origin so CORS is a no-op.
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All routes are under /api so they align with Vercel's routing rule:
#   /api/* → Python function
API = "/api"
app.include_router(auth.router,   prefix=API)
app.include_router(events.router, prefix=API)
app.include_router(admin.router,  prefix=API)
app.include_router(lookup.router, prefix=API)


@app.get("/api/health", tags=["Health"])
@app.get("/", tags=["Health"], include_in_schema=False)
def health():
    return {"status": "ok", "service": "Calendaa API", "version": "1.0.0"}
