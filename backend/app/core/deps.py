from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import read_token
from app.db.session import SessionLocal
from app.models import Doctor, Role, User, VerificationStatus

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


def current_doctor(user: User = Depends(require_doctor), db: Session = Depends(get_db)) -> Doctor:
    doctor = db.scalar(select(Doctor).where(Doctor.user_id == user.id))
    if not doctor:
        raise AppError(404, "NO_DOCTOR_PROFILE", "Finish your doctor profile so an admin can review it.")
    return doctor


def verified_doctor(doctor: Doctor = Depends(current_doctor)) -> Doctor:
    if doctor.verification_status != VerificationStatus.VERIFIED:
        raise AppError(403, "DOCTOR_NOT_VERIFIED", "An admin has to approve your profile first.")
    return doctor
