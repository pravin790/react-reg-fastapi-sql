from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pydantic import BaseModel

from .database import Base, new_id


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(24), primary_key=True, default=new_id)
    firstName: Mapped[str] = mapped_column(String(30), nullable=False)
    lastName: Mapped[str] = mapped_column(String(30), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True, index=True)
    password: Mapped[str] = mapped_column(Text, nullable=False)
    address: Mapped[str | None] = mapped_column(Text, default="")
    image: Mapped[str | None] = mapped_column(Text)
    createdAt: Mapped[object | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updatedAt: Mapped[object | None] = mapped_column(DateTime(timezone=True), nullable=True)
    extra: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan", passive_deletes=True)
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan", foreign_keys="Comment.user", passive_deletes=True)
    likes = relationship("Like", cascade="all, delete-orphan", passive_deletes=True)
    outgoing_follows = relationship("Follow", foreign_keys="Follow.follower", cascade="all, delete-orphan", passive_deletes=True)
    incoming_follows = relationship("Follow", foreign_keys="Follow.following", cascade="all, delete-orphan", passive_deletes=True)
    outgoing_blocks = relationship("Block", foreign_keys="Block.blocker", cascade="all, delete-orphan", passive_deletes=True)
    incoming_blocks = relationship("Block", foreign_keys="Block.blocked", cascade="all, delete-orphan", passive_deletes=True)


class LoginRequest(BaseModel):
    email: str | None = None
    password: str | None = None


class ChangePasswordRequest(BaseModel):
    currentPassword: str | None = None
    newPassword: str | None = None
    confirmPassword: str | None = None
