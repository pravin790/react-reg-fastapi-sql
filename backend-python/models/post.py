from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base, new_id


class Post(Base):
    __tablename__ = "posts"
    id: Mapped[str] = mapped_column(String(24), primary_key=True, default=new_id)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    images: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    likesCount: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    commentsCount: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    user: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    createdAt: Mapped[object | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    updatedAt: Mapped[object | None] = mapped_column(DateTime(timezone=True), nullable=True)
    extra: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    author = relationship("User", back_populates="posts")
    likes = relationship("Like", back_populates="post_record", cascade="all, delete-orphan", passive_deletes=True)
    comments = relationship("Comment", back_populates="post_record", cascade="all, delete-orphan", passive_deletes=True)
