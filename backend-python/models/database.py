"""PostgreSQL engine, declarative base, and session dependency."""
import os
import secrets
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("Set DATABASE_URL in backend-python/.env")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def new_id() -> str:
    return secrets.token_hex(12)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


UPLOADS = ROOT / "uploads"
UPLOADS.mkdir(exist_ok=True)

# Import all table classes so SQLAlchemy registers every relationship and mapper.
from .block import Block  # noqa: E402
from .comment import Comment  # noqa: E402
from .follow import Follow  # noqa: E402
from .like import Like  # noqa: E402
from .legacy_document import LegacyDocument  # noqa: E402
from .post import Post  # noqa: E402
from .user import User  # noqa: E402
