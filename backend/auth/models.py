"""
auth/models.py
--------------
User-related Pydantic models.
UserInDB contains the password hash — never returned to the client.
UserPublic is the safe version sent in API responses.
"""

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    full_name: str      = Field(..., min_length=2, max_length=100)
    email:     EmailStr
    password:  str      = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class UserPublic(BaseModel):
    id:         str
    full_name:  str
    email:      str
    plan:       str
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserPublic


class UserInDB(BaseModel):
    """Server-side only — never expose password_hash in responses."""
    id:            str
    full_name:     str
    email:         str
    password_hash: str
    plan:          str = "free"
    created_at:    str
