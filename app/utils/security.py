from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status, Header
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import User


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = get_settings()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(subject: str, expires_minutes: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    try:
        token = _extract_bearer_token(authorization)
        payload = decode_token(token)
        subject = payload.get("sub")
        if subject is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user_id = int(subject)
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def _extract_bearer_token(authorization: Optional[str] = None) -> str:
    if not authorization:
        # FastAPI will pass header value if dependency signature matches Header, but using lambda avoids import
        # We fallback to environment-captured header via Starlette in router using Header injection if needed
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Authorization header")

