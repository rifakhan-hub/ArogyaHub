from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError

from app.core.config import settings
from app.models.user import User

hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return hasher.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    try:
        return hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def create_access_token(user: User) -> str:
    lifetime = timedelta(minutes=settings.ACCESS_TOKEN_MINUTES)
    return _create_token({"sub": str(user.id), "role": user.role.value, "type": "access"}, lifetime)


def create_refresh_token(user: User) -> str:
    lifetime = timedelta(days=settings.REFRESH_TOKEN_DAYS)
    return _create_token({"sub": str(user.id), "type": "refresh"}, lifetime)


def read_token(token: str, token_type: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    if payload.get("type") != token_type:
        return None
    return int(payload["sub"])


def _create_token(claims: dict, lifetime: timedelta) -> str:
    now = datetime.now(UTC)
    return jwt.encode({**claims, "iat": now, "exp": now + lifetime}, settings.JWT_SECRET, algorithm="HS256")
