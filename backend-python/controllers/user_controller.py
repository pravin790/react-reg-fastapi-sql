import bcrypt, re
from datetime import datetime, timezone
from fastapi import Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import and_, or_, select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from middleware.auth import auth, token_for
from models.common import *
from models.database import get_db
from models.user import User
from models.post import Post
from models.follow import Follow
from models.block import Block
from models.user import ChangePasswordRequest, LoginRequest


def validate_profile_image(image):
    if image and not (image.content_type or "").startswith("image/"):
        raise HTTPException(400, "Only image files are allowed.")


async def register(
    firstName: str = Form(...),
    lastName: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    address: str = Form(""),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    first_name, last_name, email = (
        firstName.strip(),
        lastName.strip(),
        email.strip().lower(),
    )
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise HTTPException(400, "Please enter a valid email address.")
    if (
        len(password) < 6
        or not re.search("[A-Z]", password)
        or not re.search("[a-z]", password)
        or not re.search("[^A-Za-z0-9]", password)
    ):
        raise HTTPException(
            400,
            "Password must be at least 6 characters and include an uppercase letter, a lowercase letter, and a special character.",
        )
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(409, "Email already registered")
    if not 3 <= len(first_name) <= 30:
        raise HTTPException(400, "First name must be between 3 and 30 characters.")
    if not 1 <= len(last_name) <= 30:
        raise HTTPException(400, "Last name must be between 1 and 30 characters.")
    validate_profile_image(image)
    now = datetime.now(timezone.utc)
    user = User(
        firstName=first_name,
        lastName=last_name,
        email=email,
        password=bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode(),
        address=address,
        image=save_upload(image),
        createdAt=now,
        updatedAt=now,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Email already registered")
    return {
        "message": "Registration successful",
        "token": token_for(user),
        "user": user_payload(user),
    }


def login(body: LoginRequest, db: Session = Depends(get_db)):
    email = (body.email or "").strip().lower()
    password = body.password or ""
    if not email or not password:
        raise HTTPException(400, "Email and password are required")
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise HTTPException(400, "Please enter a valid email address.")
    user = db.scalar(select(User).where(User.email == email))
    if not user or not bcrypt.checkpw(password.encode(), user.password.encode()):
        raise HTTPException(401, "Invalid username or password")
    return {
        "message": "Login successful",
        "user": user_payload(user),
        "token": token_for(user),
    }


def relation_info(db, u, current):
    relation = db.scalar(
        select(Follow).where(Follow.follower == current, Follow.following == u.id)
    )
    return {
        "id": u.id,
        "firstName": u.firstName,
        "lastName": u.lastName,
        "image": u.image,
        "followersCount": count_follow(db, u.id, "followers"),
        "followingCount": count_follow(db, u.id, "following"),
        "isFollowing": bool(relation and relation.status == "accepted"),
        "isFollowRequested": bool(relation and relation.status == "pending"),
    }


def user_cards(db, users, current):
    ids = [u.id for u in users]
    if not ids:
        return []
    follower_counts = dict(
        db.execute(
            select(Follow.following, func.count())
            .where(Follow.status == "accepted", Follow.following.in_(ids))
            .group_by(Follow.following)
        ).all()
    )
    following_counts = dict(
        db.execute(
            select(Follow.follower, func.count())
            .where(Follow.status == "accepted", Follow.follower.in_(ids))
            .group_by(Follow.follower)
        ).all()
    )
    relations = {
        r.following: r.status
        for r in db.scalars(
            select(Follow).where(Follow.follower == current, Follow.following.in_(ids))
        ).all()
    }
    return [
        {
            "id": u.id,
            "firstName": u.firstName,
            "lastName": u.lastName,
            "image": u.image,
            "followersCount": follower_counts.get(u.id, 0),
            "followingCount": following_counts.get(u.id, 0),
            "isFollowing": relations.get(u.id) == "accepted",
            "isFollowRequested": relations.get(u.id) == "pending",
        }
        for u in users
    ]


def get_users(
    page: int = 1, limit: int = 10, me=Depends(auth), db: Session = Depends(get_db)
):
    page = max(page, 1)
    limit = min(max(limit, 1), 50)
    current = oid(me["id"])
    total = (
        db.scalar(select(func.count()).select_from(User).where(User.id != current)) or 0
    )
    users = db.scalars(
        select(User)
        .where(User.id != current)
        .order_by(User.id)
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    pages = (total + limit - 1) // limit
    return {
        "users": user_cards(db, users, current),
        "currentPage": page,
        "totalPages": pages,
        "limit": limit,
        "hasMore": page < pages,
    }


def blocked_users(
    page: int = 1, limit: int = 10, me=Depends(auth), db: Session = Depends(get_db)
):
    current = oid(me["id"])
    page = max(page, 1)
    limit = min(max(limit, 1), 50)
    q = (
        select(User)
        .join(Block, Block.blocked == User.id)
        .where(Block.blocker == current)
        .order_by(Block.createdAt.desc())
    )
    total = (
        db.scalar(
            select(func.count()).select_from(Block).where(Block.blocker == current)
        )
        or 0
    )
    result = db.scalars(q.offset((page - 1) * limit).limit(limit)).all()
    return {
        "users": user_cards(db, result, current),
        "currentPage": page,
        "hasMore": page * limit < total,
    }


def follow_list(uid, kind, page, limit, current, db):
    target = oid(uid)
    page = max(page, 1)
    limit = min(max(limit, 1), 50)
    key = Follow.following if kind == "followers" else Follow.follower
    person = Follow.follower if kind == "followers" else Follow.following
    total = (
        db.scalar(
            select(func.count())
            .select_from(Follow)
            .where(key == target, Follow.status == "accepted")
        )
        or 0
    )
    users = db.scalars(
        select(User)
        .join(Follow, person == User.id)
        .where(key == target, Follow.status == "accepted")
        .order_by(Follow.createdAt.desc(), Follow.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    return {
        "users": user_cards(db, users, current),
        "currentPage": page,
        "totalPages": (total + limit - 1) // limit,
        "limit": limit,
        "hasMore": page * limit < total,
    }


def followers(
    uid, page: int = 1, limit: int = 10, me=Depends(auth), db: Session = Depends(get_db)
):
    return follow_list(uid, "followers", page, limit, oid(me["id"]), db)


def following(
    uid, page: int = 1, limit: int = 10, me=Depends(auth), db: Session = Depends(get_db)
):
    return follow_list(uid, "following", page, limit, oid(me["id"]), db)


def profile(uid, me=Depends(auth), db: Session = Depends(get_db)):
    target = oid(uid)
    current = oid(me["id"])
    user = db.get(User, target)
    if not user:
        raise HTTPException(404, "User not found")
    rel = db.scalar(
        select(Follow).where(Follow.follower == current, Follow.following == target)
    )
    return {
        "user": {
            "id": target,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "image": user.image,
            "address": user.address or "",
            "followersCount": count_follow(db, target, "followers"),
            "followingCount": count_follow(db, target, "following"),
            "postCount": db.scalar(
                select(func.count()).select_from(Post).where(Post.user == target)
            )
            or 0,
            "isFollowing": bool(rel and rel.status == "accepted"),
            "isFollowRequested": bool(rel and rel.status == "pending"),
            "isBlockedByCurrentUser": db.scalar(
                select(func.count())
                .select_from(Block)
                .where(Block.blocker == current, Block.blocked == target)
            )
            > 0,
            "isBlockingCurrentUser": db.scalar(
                select(func.count())
                .select_from(Block)
                .where(Block.blocker == target, Block.blocked == current)
            )
            > 0,
            "pendingFollowRequestCount": (
                db.scalar(
                    select(func.count())
                    .select_from(Follow)
                    .where(Follow.following == target, Follow.status == "pending")
                )
                if target == current
                else None
            ),
        }
    }


def follow(uid, me=Depends(auth), db: Session = Depends(get_db)):
    current, target = oid(me["id"]), oid(uid)
    if current == target:
        raise HTTPException(400, "You cannot follow yourself")
    if not db.get(User, target):
        raise HTTPException(404, "User not found")
    if db.scalar(
        select(Block.id).where(
            or_(
                and_(Block.blocker == current, Block.blocked == target),
                and_(Block.blocker == target, Block.blocked == current),
            )
        )
    ):
        raise HTTPException(
            403, "This user cannot be followed while either user has blocked the other."
        )
    rel = db.scalar(
        select(Follow).where(Follow.follower == current, Follow.following == target)
    )
    if not rel:
        now = datetime.now(timezone.utc)
        rel = Follow(
            follower=current,
            following=target,
            status="pending",
            createdAt=now,
            updatedAt=now,
        )
        db.add(rel)
        db.commit()
    return {
        "isFollowing": rel.status == "accepted",
        "isFollowRequested": rel.status == "pending",
        "followersCount": count_follow(db, target, "followers"),
        "followingCount": count_follow(db, current, "following"),
    }


def unfollow(uid, me=Depends(auth), db: Session = Depends(get_db)):
    current, target = oid(me["id"]), oid(uid)
    rel = db.scalar(
        select(Follow).where(Follow.follower == current, Follow.following == target)
    )
    if rel:
        db.delete(rel)
        db.commit()
    return {
        "isFollowing": False,
        "isFollowRequested": False,
        "followersCount": count_follow(db, target, "followers"),
        "followingCount": count_follow(db, current, "following"),
    }


def block(uid, me=Depends(auth), db: Session = Depends(get_db)):
    current, target = oid(me["id"]), oid(uid)
    if current == target:
        raise HTTPException(400, "You cannot block yourself")
    if not db.get(User, target):
        raise HTTPException(404, "User not found")
    if not db.scalar(
        select(Block.id).where(Block.blocker == current, Block.blocked == target)
    ):
        now = datetime.now(timezone.utc)
        db.add(Block(blocker=current, blocked=target, createdAt=now, updatedAt=now))
    db.execute(
        Follow.__table__.delete().where(
            or_(
                and_(Follow.follower == current, Follow.following == target),
                and_(Follow.follower == target, Follow.following == current),
            )
        )
    )
    db.commit()
    return {"isBlocked": True}


def unblock(uid, me=Depends(auth), db: Session = Depends(get_db)):
    rel = db.scalar(
        select(Block).where(Block.blocker == oid(me["id"]), Block.blocked == oid(uid))
    )
    if rel:
        db.delete(rel)
        db.commit()
    return {"isBlocked": False}


def requests(uid, page: int = 1, me=Depends(auth), db: Session = Depends(get_db)):
    target = oid(uid)
    if target != me["id"]:
        raise HTTPException(403, "Not authorized to manage these requests")
    page = max(page, 1)
    total = (
        db.scalar(
            select(func.count())
            .select_from(Follow)
            .where(Follow.following == target, Follow.status == "pending")
        )
        or 0
    )
    users = db.scalars(
        select(User)
        .join(Follow, Follow.follower == User.id)
        .where(Follow.following == target, Follow.status == "pending")
        .order_by(Follow.createdAt.desc())
        .offset((page - 1) * 10)
        .limit(10)
    ).all()
    return {
        "requests": [
            {
                "id": u.id,
                "firstName": u.firstName,
                "lastName": u.lastName,
                "image": u.image,
            }
            for u in users
        ],
        "currentPage": page,
        "hasMore": page * 10 < total,
    }


def accept_request(uid, requester, me=Depends(auth), db: Session = Depends(get_db)):
    return answer_request(uid, requester, me, True, db)


def reject_request(uid, requester, me=Depends(auth), db: Session = Depends(get_db)):
    return answer_request(uid, requester, me, False, db)


def answer_request(uid, requester, me, accept, db):
    target, requester_id = oid(uid), oid(requester)
    if target != me["id"]:
        raise HTTPException(403, "Not authorized to manage these requests")
    rel = db.scalar(
        select(Follow).where(
            Follow.follower == requester_id,
            Follow.following == target,
            Follow.status == "pending",
        )
    )
    if not rel:
        raise HTTPException(404, "Follow request not found")
    if accept:
        rel.status = "accepted"
    else:
        db.delete(rel)
    db.commit()
    return {
        "accepted": accept,
        "followersCount": count_follow(db, target, "followers"),
        "followingCount": count_follow(db, requester_id, "following"),
    }


async def update_profile(
    firstName: str | None = Form(None),
    lastName: str | None = Form(None),
    address: str | None = Form(None),
    image: UploadFile | None = File(None),
    me=Depends(auth),
    db: Session = Depends(get_db),
):
    user = db.get(User, oid(me["id"]))
    if not user:
        raise HTTPException(404, "User not found")
    fn = (firstName or user.firstName).strip()
    ln = (lastName or user.lastName).strip()
    if not 3 <= len(fn) <= 30:
        raise HTTPException(400, "First name must be between 3 and 30 characters.")
    if not 1 <= len(ln) <= 30:
        raise HTTPException(400, "Last name must be between 1 and 30 characters.")
    validate_profile_image(image)
    user.firstName = fn
    user.lastName = ln
    user.address = address if address is not None else (user.address or "")
    if image:
        previous = user.image
        user.image = save_upload(image)
        if previous:
            file_path(previous)
    user.updatedAt = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Profile updated successfully", "user": user_payload(user)}


def change_password(
    body: ChangePasswordRequest, me=Depends(auth), db: Session = Depends(get_db)
):
    current, new = body.currentPassword or "", body.newPassword or ""
    if not current or not new or not body.confirmPassword:
        raise HTTPException(
            400, "Current password, new password, and confirmation are required."
        )
    if new != body.confirmPassword:
        raise HTTPException(400, "New password and confirmation do not match.")
    if (
        len(new) < 6
        or not re.search("[A-Z]", new)
        or not re.search("[a-z]", new)
        or not re.search("[^A-Za-z0-9]", new)
    ):
        raise HTTPException(
            400,
            "Password must be at least 6 characters and include an uppercase letter, a lowercase letter, and a special character.",
        )
    user = db.get(User, oid(me["id"]))
    if not user or not bcrypt.checkpw(current.encode(), user.password.encode()):
        raise HTTPException(401, "Current password is incorrect.")
    user.password = bcrypt.hashpw(new.encode(), bcrypt.gensalt()).decode()
    user.updatedAt = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Password updated successfully"}
