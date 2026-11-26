from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base, new_id


class Block(Base):
    __tablename__ = "blocks"
    id: Mapped[str] = mapped_column(String(24), primary_key=True, default=new_id)
    blocker: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    blocked: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    createdAt: Mapped[object | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updatedAt: Mapped[object | None] = mapped_column(DateTime(timezone=True), nullable=True)
    extra: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    __table_args__ = (UniqueConstraint("blocker", "blocked", name="uq_blocks_pair"),)
__all__ = ["Block"]
