import json, re
from datetime import datetime, timezone
from fastapi import Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import Session, joinedload
from middleware.auth import auth
from models.common import *
from models.database import get_db
from models.user import User
from models.post import Post
from models.comment import Comment
from models.like import Like
from models.block import Block
from models.comment import CreateCommentRequest

ALLOWED_MEDIA_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
}


def validate_media_files(files):
    if any(f.content_type not in ALLOWED_MEDIA_TYPES for f in files):
        raise HTTPException(
            400, "Only JPG, PNG, GIF, MP4, WebM, OGG, and MOV files are allowed."
        )


def post_out(db, p, current):
    data = ident(p)
    data["user"] = public_user(p.author, ["_id", "firstName", "lastName", "email"])
    data["likesCount"] = (
        db.scalar(select(func.count()).select_from(Like).where(Like.post == p.id)) or 0
    )
    data["commentsCount"] = (
        db.scalar(select(func.count()).select_from(Comment).where(Comment.post == p.id))
        or 0
    )
    data["likedByCurrentUser"] = bool(
        current
        and db.scalar(select(Like.id).where(Like.post == p.id, Like.user == current))
    )
    return data


def post_out_many(db, posts, current):
    ids = [p.id for p in posts]
    if not ids:
        return []
    like_counts = dict(
        db.execute(
            select(Like.post, func.count())
            .where(Like.post.in_(ids))
            .group_by(Like.post)
        ).all()
    )
    comment_counts = dict(
        db.execute(
            select(Comment.post, func.count())
            .where(Comment.post.in_(ids))
            .group_by(Comment.post)
        ).all()
    )
    liked = (
        set(
            db.scalars(
                select(Like.post).where(Like.post.in_(ids), Like.user == current)
            ).all()
        )
        if current
        else set()
    )
    result = []
    for p in posts:
        data = ident(p)
        data["user"] = public_user(p.author, ["_id", "firstName", "lastName", "email"])
        data["likesCount"] = like_counts.get(p.id, 0)
        data["commentsCount"] = comment_counts.get(p.id, 0)
        data["likedByCurrentUser"] = p.id in liked
        result.append(data)
    return result


def get_posts(
    page: int = 1,
    limit: int = 5,
    userId: str | None = None,
    me=Depends(auth),
    db: Session = Depends(get_db),
):
    page = max(page, 1)
    limit = min(max(limit, 1), 50)
    current = oid(me["id"])
    q = select(Post).options(joinedload(Post.author))
    if userId:
        q = q.where(Post.user == oid(userId))
    else:
        q = q.where(
            ~Post.user.in_(select(Block.blocked).where(Block.blocker == current))
        )
    total = db.scalar(select(func.count()).select_from(q.subquery())) or 0
    result = db.scalars(
        q.order_by(Post.createdAt.desc()).offset((page - 1) * limit).limit(limit)
    ).all()
    return {
        "posts": post_out_many(db, result, current),
        "totalPosts": total,
        "currentPage": page,
        "totalPages": (total + limit - 1) // limit,
        "limit": limit,
    }


async def create_post(
    title: str = Form(...),
    description: str = Form(...),
    images: list[UploadFile] = File(default=[]),
    me=Depends(auth),
    db: Session = Depends(get_db),
):
    plain = re.sub(r"<[^>]*>", "", description).strip()
    if not 3 <= len(title.strip()) <= 100:
        raise HTTPException(400, "Title must be between 3 and 100 characters")
    if not 2 <= len(plain) <= 1000:
        raise HTTPException(400, "Description must be between 2 and 1000 characters")
    if not images:
        raise HTTPException(400, "Please select at least one image or video.")
    if len(images) > 10:
        raise HTTPException(400, "You can upload a maximum of 10 media files")
    validate_media_files(images)
    now = datetime.now(timezone.utc)
    p = Post(
        title=title.strip(),
        description=description,
        images=[save_upload(i) for i in images],
        user=oid(me["id"]),
        createdAt=now,
        updatedAt=now,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    db.refresh(p.author)
    return {
        "message": "Post created successfully",
        "post": post_out(db, p, oid(me["id"])),
    }


def get_likes(pid, page: int = 1, me=Depends(auth), db: Session = Depends(get_db)):
    post_id = oid(pid)
    if not db.get(Post, post_id):
        raise HTTPException(404, "Post not found")
    page = max(page, 1)
    total = (
        db.scalar(select(func.count()).select_from(Like).where(Like.post == post_id))
        or 0
    )
    users = db.scalars(
        select(User)
        .join(Like, Like.user == User.id)
        .where(Like.post == post_id)
        .order_by(Like.createdAt)
        .offset((page - 1) * 3)
        .limit(3)
    ).all()
    pages = (total + 2) // 3
    return {
        "users": [public_user(u) for u in users],
        "totalLikes": total,
        "currentPage": page,
        "totalPages": pages,
        "limit": 3,
        "hasMore": page < pages,
    }


async def update_post(
    pid,
    title: str = Form(...),
    description: str = Form(...),
    existingImages: str | None = Form(None),
    images: list[UploadFile] = File(default=[]),
    me=Depends(auth),
    db: Session = Depends(get_db),
):
    p = db.get(Post, oid(pid))
    current = oid(me["id"])
    if not p:
        raise HTTPException(404, "Post not found")
    if p.user != current:
        raise HTTPException(403, "You can only edit your own posts")
    plain = re.sub(r"<[^>]*>", "", description).strip()
    if not 3 <= len(title.strip()) <= 100:
        raise HTTPException(400, "Title must be between 3 and 100 characters")
    if not 2 <= len(plain) <= 1000:
        raise HTTPException(400, "Description must be between 2 and 1000 characters")
    retained = p.images or []
    if existingImages is not None:
        try:
            retained = json.loads(existingImages)
        except (ValueError, TypeError):
            raise HTTPException(400, "Invalid existing images")
        if not isinstance(retained, list) or any(
            not isinstance(i, str) for i in retained
        ):
            raise HTTPException(400, "Invalid existing images")
    if len(retained) + len(images) > 10:
        raise HTTPException(400, "You can upload a maximum of 10 media files")
    validate_media_files(images)
    removed = set(p.images or []) - set(retained)
    p.title = title.strip()
    p.description = description
    p.images = retained + [save_upload(i) for i in images]
    p.updatedAt = datetime.now(timezone.utc)
    db.commit()
    db.refresh(p)
    db.refresh(p.author)
    for path in removed:
        file_path(path)
    return {"message": "Post updated successfully", "post": post_out(db, p, current)}


def delete_post(pid, me=Depends(auth), db: Session = Depends(get_db)):
    p = db.get(Post, oid(pid))
    current = oid(me["id"])
    if not p:
        raise HTTPException(404, "Post not found")
    if p.user != current:
        raise HTTPException(403, "You can only edit your own posts")
    for path in p.images or []:
        file_path(path)
    db.delete(p)
    db.commit()
    return {"message": "Post deleted successfully"}


def toggle_like(pid, me=Depends(auth), db: Session = Depends(get_db)):
    post_id, user_id = oid(pid), oid(me["id"])
    p = db.get(Post, post_id)
    if not p:
        raise HTTPException(404, "Post not found")
    rel = db.scalar(select(Like).where(Like.post == post_id, Like.user == user_id))
    if rel:
        db.delete(rel)
        liked = False
    else:
        now = datetime.now(timezone.utc)
        db.add(Like(post=post_id, user=user_id, createdAt=now, updatedAt=now))
        liked = True
    db.flush()
    count = (
        db.scalar(select(func.count()).select_from(Like).where(Like.post == post_id))
        or 0
    )
    p.likesCount = count
    db.commit()
    return {
        "message": "Post liked" if liked else "Post unliked",
        "liked": liked,
        "likesCount": count,
    }


def comment_out(db, c):
    data = ident(c)
    data["user"] = public_user(c.author, ["_id", "firstName", "lastName"])
    return data


def get_comments(
    pid, page: int = 1, limit: int = 5, me=Depends(auth), db: Session = Depends(get_db)
):
    post_id = oid(pid)
    if not db.get(Post, post_id):
        raise HTTPException(404, "Post not found")
    page = max(page, 1)
    limit = min(max(limit, 1), 50)
    condition = and_(Comment.post == post_id, Comment.parentComment.is_(None))
    total = db.scalar(select(func.count()).select_from(Comment).where(condition)) or 0
    roots = db.scalars(
        select(Comment)
        .options(joinedload(Comment.author))
        .where(condition)
        .order_by(Comment.createdAt)
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    ids = [c.id for c in roots]
    replies = (
        db.scalars(
            select(Comment)
            .options(joinedload(Comment.author))
            .where(Comment.parentComment.in_(ids))
            .order_by(Comment.createdAt)
        ).all()
        if ids
        else []
    )
    output = []
    for c in roots:
        item = comment_out(db, c)
        item["replies"] = [
            comment_out(db, r) for r in replies if r.parentComment == c.id
        ]
        output.append(item)
    pages = (total + limit - 1) // limit
    return {
        "comments": output,
        "currentPage": page,
        "totalPages": pages,
        "totalComments": total,
        "limit": limit,
        "hasMore": page < pages,
    }


def create_comment(
    pid, body: CreateCommentRequest, me=Depends(auth), db: Session = Depends(get_db)
):
    post_id = oid(pid)
    text = (body.text or "").strip()
    parent = oid(body.parentComment) if body.parentComment else None
    if not text or len(text) > 500:
        raise HTTPException(400, "Comment must contain between 1 and 500 characters")
    p = db.get(Post, post_id)
    if not p:
        raise HTTPException(404, "Post not found")
    if parent and not db.scalar(
        select(Comment.id).where(Comment.id == parent, Comment.post == post_id)
    ):
        raise HTTPException(404, "Parent comment not found")
    now = datetime.now(timezone.utc)
    c = Comment(
        text=text,
        post=post_id,
        user=oid(me["id"]),
        parentComment=parent,
        createdAt=now,
        updatedAt=now,
    )
    db.add(c)
    db.flush()
    count = (
        db.scalar(
            select(func.count()).select_from(Comment).where(Comment.post == post_id)
        )
        or 0
    )
    p.commentsCount = count
    db.commit()
    db.refresh(c)
    return {
        "message": "Comment added successfully",
        "comment": comment_out(db, c),
        "commentsCount": count,
    }


def delete_comment(pid, cid, me=Depends(auth), db: Session = Depends(get_db)):
    post_id = oid(pid)
    c = db.scalar(
        select(Comment).where(Comment.id == oid(cid), Comment.post == post_id)
    )
    if not c:
        raise HTTPException(404, "Comment not found")
    if c.user != oid(me["id"]):
        raise HTTPException(403, "You can only delete your own comments")
    db.execute(Comment.__table__.delete().where(Comment.parentComment == c.id))
    db.delete(c)
    db.flush()
    count = (
        db.scalar(
            select(func.count()).select_from(Comment).where(Comment.post == post_id)
        )
        or 0
    )
    p = db.get(Post, post_id)
    p.commentsCount = count
    db.commit()
    return {"message": "Comment deleted successfully", "commentsCount": count}
