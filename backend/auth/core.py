"""
auth/core.py
------------
Password hashing (bcrypt) and JWT tokens.
Uses bcrypt directly — no passlib — to avoid the 72-byte passlib bug.
"""

import os
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt

SECRET_KEY         = os.environ.get("SECRET_KEY", "dev-secret-change-before-production")
ALGORITHM          = "HS256"
TOKEN_EXPIRE_HOURS = 24


def hash_password(plain: str) -> str:
    """Hash a password. Truncates to 72 bytes — bcrypt's hard limit."""
    return bcrypt.hashpw(plain.encode("utf-8")[:72], bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the stored hash."""
    return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    """Create a signed JWT that expires in TOKEN_EXPIRE_HOURS."""
    payload = {
        "sub":   user_id,
        "email": email,
        "exp":   datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT. Raises JWTError if invalid or expired."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
