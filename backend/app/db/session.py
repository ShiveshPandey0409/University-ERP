"""SQLAlchemy engine/session for the existing SQL Server database.

Phase 1 maps ORM models onto the CURRENT tables (no schema changes). Business
logic is reimplemented in the service layer — we do not call the legacy procs.
"""
from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import settings

Base = declarative_base()

# Engine is created lazily so importing the app (and /health) never requires the
# ODBC driver / a live DB. First DB request builds and caches the engine.
SessionLocal = sessionmaker(autoflush=False, autocommit=False, future=True)


@lru_cache
def get_engine() -> Engine:
    return create_engine(
        settings.sqlalchemy_url,
        pool_pre_ping=True,
        fast_executemany=True,  # speeds up bulk inserts (e.g. marks upload)
        future=True,
    )


@lru_cache
def get_adm_engine() -> Engine:
    """Engine for the separate PtsnsuAdmission database."""
    return create_engine(settings.adm_sqlalchemy_url, pool_pre_ping=True, future=True)


def get_db() -> Iterator[Session]:
    db = SessionLocal(bind=get_engine())
    try:
        yield db
    finally:
        db.close()


def get_adm_db() -> Iterator[Session]:
    db = SessionLocal(bind=get_adm_engine())
    try:
        yield db
    finally:
        db.close()
