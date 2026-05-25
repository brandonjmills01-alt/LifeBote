"""
auth/dependencies.py
--------------------
FastAPI dependency for protecting routes.

Usage:
    from auth.dependencies import require_auth

    @router.get("/protected")
    def my_route(user = Depends(require_auth)):
        return {"hello": user.email}
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from auth.core  import decode_access_token
from auth.store import get_by_id
from auth.models import UserInDB

_bearer = HTTPBearer()

_401 = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid or expired session. Please log in again.",
    headers={"WWW-Authenticate": "Bearer"},
)


def require_auth(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
) -> UserInDB:
    try:
        payload = decode_access_token(creds.credentials)
        uid     = payload.get("sub")
        if not uid:
            raise _401
    except JWTError:
        raise _401

    user = get_by_id(uid)
    if not user:
        raise _401
    return user
