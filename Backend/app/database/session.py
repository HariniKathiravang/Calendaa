from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from app.config import settings


db_url = settings.DATABASE_URL

# SQLite needs check_same_thread=False; PostgreSQL needs no special args
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# ── PostgreSQL / Supabase via PgBouncer transaction pooler (port 6543) ────────
# PgBouncer in transaction mode does NOT support server-side prepared statements.
# SQLAlchemy 2 + psycopg2 caches prepared statements by default, which causes
# silent write failures or "prepared statement does not exist" errors.
#
# Fix: set prepare_threshold=None on every new connection to disable the cache.
# Also use NullPool on serverless (Vercel) to avoid connection leaks.
engine_kwargs: dict = {"connect_args": connect_args}
if db_url.startswith("postgresql"):
    engine_kwargs["poolclass"] = NullPool

engine = create_engine(db_url, **engine_kwargs)

# Disable psycopg2 prepared-statement cache for PgBouncer compatibility
if db_url.startswith("postgresql"):
    @event.listens_for(engine, "connect")
    def _disable_prepared_stmt_cache(dbapi_conn, conn_record):
        # psycopg2 sets prepare_threshold=5 by default; None disables it entirely
        dbapi_conn.prepare_threshold = None  # type: ignore[attr-defined]

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

