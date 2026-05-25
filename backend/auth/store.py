"""
auth/store.py
-------------
In-memory user store for the mock.
To go to production: replace these functions with PostgreSQL queries.
The rest of the codebase only calls these functions — nothing else changes.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional
from auth.models import UserInDB

_by_id:    dict[str, dict] = {}
_by_email: dict[str, str]  = {}


def create_user(full_name: str, email: str, password_hash: str) -> UserInDB:
    """Create a user. Raises ValueError if email already registered."""
    normalized = email.lower()
    if normalized in _by_email:
        raise ValueError("An account with this email already exists.")

    uid    = str(uuid.uuid4())
    record = {
        "id":            uid,
        "full_name":     full_name,
        "email":         normalized,
        "password_hash": password_hash,
        "plan":          "free",
        "created_at":    datetime.now(timezone.utc).isoformat(),
    }
    _by_id[uid]        = record
    _by_email[normalized] = uid
    return UserInDB(**record)


def get_by_email(email: str) -> Optional[UserInDB]:
    uid = _by_email.get(email.lower())
    return UserInDB(**_by_id[uid]) if uid else None


def get_by_id(user_id: str) -> Optional[UserInDB]:
    rec = _by_id.get(user_id)
    return UserInDB(**rec) if rec else None
