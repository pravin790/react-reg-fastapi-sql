import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import jwt
from dotenv import load_dotenv
from fastapi import Header, HTTPException

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
SECRET = os.getenv("JWT_SECRET")
if not SECRET:
    raise RuntimeError("Set JWT_SECRET in backend-python/.env")


def token_for(user):
    return jwt.encode(
        {"id": str(user.id), "email": user.email,
         "exp": datetime.now(timezone.utc) + timedelta(days=7)},
        SECRET,
        algorithm="HS256",
    )


def auth(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authentication required")
    try:
        return jwt.decode(authorization[7:], SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired token")
