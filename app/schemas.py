from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserOut(UserBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class JobBase(BaseModel):
    title: str
    description: str
    skills: Optional[List[str]] = None


class JobCreate(JobBase):
    pass


class JobOut(JobBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ResumeOut(BaseModel):
    id: int
    filename: str
    parsed: bool
    skills: Optional[List[str]] = None
    created_at: datetime

    model_config = {"from_attributes": True}

