from sqlalchemy import DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base, new_id


class Follow(Base):
    __tablename__ = "follows"
    id: Mapped[str] = mapped_column(String(24), primary_key=True, default=new_id)
    follower: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    following: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="accepted")
    createdAt: Mapped[object | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updatedAt: Mapped[object | None] = mapped_column(DateTime(timezone=True), nullable=True)
    extra: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    __table_args__ = (
        UniqueConstraint("follower", "following", name="uq_follows_pair"),
        Index("ix_follows_following_status", "following", "status"),
    )
__all__ = ["Follow"]
