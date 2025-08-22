from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import get_settings


settings = get_settings()

# SQLite needs check_same_thread=False when used in single-threaded dev servers
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, echo=False, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)

Base = declarative_base()


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


