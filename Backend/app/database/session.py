from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from app.config import settings

db_url = settings.DATABASE_URL

is_postgres = db_url.startswith("postgresql")
is_sqlite   = db_url.startswith("sqlite")

# SQLite requires check_same_thread=False for multi-threaded use
connect_args = {"check_same_thread": False} if is_sqlite else {}

# Serverless environments (Vercel) need NullPool so every request gets a
# fresh connection instead of reusing a stale one from a dead worker.
engine_kwargs: dict = {"connect_args": connect_args}
if is_postgres:
    engine_kwargs["poolclass"] = NullPool

engine = create_engine(db_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
