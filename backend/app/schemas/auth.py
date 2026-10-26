from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.models.user import UserRole

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: "UserResponse"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    institution_id: Optional[int] = None
    exp: Optional[int] = None

class UserBase(BaseModel):
    email: str
    full_name: str
    role: UserRole
    institution_id: Optional[int] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    last_login: Optional[datetime] = None
    created_at: datetime
    institution_name: Optional[str] = None

    class Config:
        from_attributes = True
