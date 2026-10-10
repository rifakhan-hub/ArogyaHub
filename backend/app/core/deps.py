from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import read_token
from app.db.session import SessionLocal
from app.models.user import Role, User

bearer = HTTPBearer(auto_error=False)


def get_db():
    with SessionLocal() as db:
        yield db


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    user_id = read_token(credentials.credentials, "access") if credentials else None
    user = db.get(User, user_id) if user_id else None
    if not user:
        raise AppError(401, "UNAUTHENTICATED", "Your session has ended. Log in again.")
    if not user.is_active:
        raise AppError(403, "ACCOUNT_BLOCKED", "This account is blocked. Contact support.")
    return user


def require_role(role: Role):
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role != role:
            raise AppError(403, "FORBIDDEN", f"Only {role.value}s can do this.")
        return user

    return checker


require_admin = require_role(Role.ADMIN)
require_doctor = require_role(Role.DOCTOR)
require_patient = require_role(Role.PATIENT)
