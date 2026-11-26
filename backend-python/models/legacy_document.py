from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class LegacyDocument(Base):
    """Lossless storage for source collections beyond the application schema."""
    __tablename__ = "legacy_documents"
    collection: Mapped[str] = mapped_column(String(255), primary_key=True)
    id: Mapped[str] = mapped_column(String(24), primary_key=True)
    document: Mapped[dict] = mapped_column(JSONB, nullable=False)
