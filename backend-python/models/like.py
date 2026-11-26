from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base, new_id


class Like(Base):
    __tablename__ = "likes"
    id: Mapped[str] = mapped_column(String(24), primary_key=True, default=new_id)
    post: Mapped[str] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    createdAt: Mapped[object | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updatedAt: Mapped[object | None] = mapped_column(DateTime(timezone=True), nullable=True)
    extra: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    post_record = relationship("Post", back_populates="likes")
    __table_args__ = (UniqueConstraint("post", "user", name="uq_likes_post_user"),)
__all__ = ["Like"]
