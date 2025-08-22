from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import Token, UserCreate, UserOut, LoginRequest
from ..utils.security import create_access_token, get_current_user, hash_password, verify_password


router = APIRouter()


@router.post("/signup", response_model=UserOut)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(email=payload.email, full_name=payload.full_name, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    token = create_access_token(str(user.id), expires_minutes=60)
    return Token(access_token=token, expires_in_minutes=60)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user

