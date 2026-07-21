from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from app.config import settings


# SQLite needs check_same_thread=False; PostgreSQL needs no special args
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Use NullPool for PostgreSQL in serverless environments (Vercel) to avoid
# connection leaks — each request gets a fresh connection.
# SQLite uses the default pool which is fine for local development.
engine_kwargs: dict = {"connect_args": connect_args}
if settings.DATABASE_URL.startswith("postgresql"):
    engine_kwargs["poolclass"] = NullPool

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
