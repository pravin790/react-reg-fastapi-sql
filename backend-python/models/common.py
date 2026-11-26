import secrets, time
from datetime import datetime
from pathlib import Path
from fastapi import HTTPException
from .database import ROOT, UPLOADS
from .follow import Follow

def oid(value):
    value = str(value)
    if len(value) != 24 or any(c not in "0123456789abcdefABCDEF" for c in value):
        raise HTTPException(400, "Invalid ID")
    return value.lower()

def ident(doc):
    if doc is None: return None
    result = {k: getattr(doc, k) for k in ("id", "user", "post", "parentComment", "follower", "following", "blocker", "blocked", "status", "text", "title", "description", "images", "likesCount", "commentsCount", "createdAt", "updatedAt") if hasattr(doc, k)}
    result.update(getattr(doc, "extra", {}) or {})
    result["_id"] = result.pop("id")
    for key in ("createdAt", "updatedAt"):
        if isinstance(result.get(key), datetime): result[key] = result[key].isoformat().replace("+00:00", "Z")
    return result

def public_user(u, fields=None):
    if not u: return None
    allowed = fields or ["_id", "firstName", "lastName", "email", "image", "address"]
    values = {"_id": u.id, "firstName": u.firstName, "lastName": u.lastName, "email": u.email, "image": u.image, "address": u.address}
    return {k: values.get(k) for k in allowed}

def user_payload(u):
    return {"id": u.id, "firstName": u.firstName, "lastName": u.lastName, "email": u.email, "address": u.address or "", "image": u.image}

def save_upload(file):
    if not file: return None
    ext = Path(file.filename or "").suffix
    name = f"{int(time.time()*1000)}-{secrets.randbelow(10**9)}{ext}"
    size = 0
    with (UPLOADS/name).open("wb") as out:
        while chunk := file.file.read(1024*1024):
            size += len(chunk)
            if size > 50*1024*1024:
                out.close(); (UPLOADS/name).unlink(missing_ok=True)
                raise HTTPException(400, "Image or video size must not exceed 50 MB.")
            out.write(chunk)
    return f"uploads/{name}"

def count_follow(db, user_id, direction):
    from sqlalchemy import func, select
    key = Follow.following if direction == "followers" else Follow.follower
    return db.scalar(select(func.count()).select_from(Follow).where(key == user_id, Follow.status == "accepted")) or 0

def file_path(s):
    p = ROOT / s
    if p.exists(): p.unlink()
