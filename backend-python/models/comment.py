from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pydantic import BaseModel, Field

from .database import Base, new_id


class Comment(Base):
    __tablename__ = "comments"
    id: Mapped[str] = mapped_column(String(24), primary_key=True, default=new_id)
    text: Mapped[str] = mapped_column(String(500), nullable=False)
    post: Mapped[str] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parentComment: Mapped[str | None] = mapped_column(ForeignKey("comments.id", ondelete="CASCADE"), index=True)
    createdAt: Mapped[object | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    updatedAt: Mapped[object | None] = mapped_column(DateTime(timezone=True), nullable=True)
    extra: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    post_record = relationship("Post", back_populates="comments")
    parent = relationship("Comment", remote_side="Comment.id")
    author = relationship("User", back_populates="comments", foreign_keys=[user])


class CreateCommentRequest(BaseModel):
    text: str | None = Field(default=None, max_length=500)
    parentComment: str | None = None
