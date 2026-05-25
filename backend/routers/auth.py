"""
routers/auth.py
POST /api/auth/signup  — create account, returns token
POST /api/auth/login   — verify credentials, returns token
GET  /api/auth/me      — returns current user (requires token)
"""

from fastapi import APIRouter, HTTPException, Depends, status
from auth.models       import SignupRequest, LoginRequest, TokenResponse, UserPublic
from auth.core         import hash_password, verify_password, create_access_token
from auth.store        import create_user, get_by_email
from auth.dependencies import require_auth

router = APIRouter()


@router.post("/signup", response_model=TokenResponse, status_code=201)
def signup(body: SignupRequest):
    try:
        user = create_user(body.full_name, body.email, hash_password(body.password))
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return TokenResponse(
        access_token=create_access_token(user.id, user.email),
        user=UserPublic(**user.model_dump()),
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    _bad = HTTPException(status_code=401, detail="Incorrect email or password.")
    user = get_by_email(body.email)
    if not user or not verify_password(body.password, user.password_hash):
        raise _bad
    return TokenResponse(
        access_token=create_access_token(user.id, user.email),
        user=UserPublic(**user.model_dump()),
    )


@router.get("/me", response_model=UserPublic)
def get_me(current_user=Depends(require_auth)):
    return UserPublic(**current_user.model_dump())
