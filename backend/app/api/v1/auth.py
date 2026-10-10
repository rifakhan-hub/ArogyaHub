from fastapi import APIRouter, Cookie, Depends, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_db
from app.core.errors import AppError
from app.core.security import create_access_token, create_refresh_token, hash_password, read_token, verify_password
from app.models import Doctor, Patient, Role, User
from app.models.user import utcnow
from app.schemas.auth import AccountFields, LoginRequest, RegisterRequest, TokenResponse
from app.schemas.doctor import PROFILE_FIELDS, DoctorOut, DoctorRegisterRequest
from app.schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "refresh_token"
COOKIE_PATH = "/api/v1/auth"


@router.post("/register", response_model=UserOut, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    user = new_user(db, body, Role.PATIENT)
    db.add(Patient(user=user))
    save(db)
    return UserOut.model_validate(user)


@router.post("/register/doctor", response_model=DoctorOut, status_code=201)
def register_doctor(body: DoctorRegisterRequest, db: Session = Depends(get_db)):
    user = new_user(db, body, Role.DOCTOR)
    if db.scalar(select(Doctor.id).where(Doctor.license_number == body.license_number)):
        raise AppError(409, "LICENSE_TAKEN", "Another doctor has already registered this licence number.")

    doctor = Doctor(user=user, **body.model_dump(include=PROFILE_FIELDS))
    db.add(doctor)
    save(db)
    return DoctorOut.from_doctor(doctor)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if not user or not verify_password(body.password, user.password_hash):
        raise AppError(401, "INVALID_CREDENTIALS", "That email and password don't match. Check them and try again.")
    if not user.is_active:
        raise AppError(403, "ACCOUNT_BLOCKED", "This account is blocked. Contact support.")

    user.last_login_at = utcnow()
    db.commit()
    return sign_in(user, response)


@router.post("/refresh", response_model=TokenResponse)
def refresh(response: Response, refresh_token: str | None = Cookie(None), db: Session = Depends(get_db)):
    user_id = read_token(refresh_token, "refresh") if refresh_token else None
    user = db.get(User, user_id) if user_id else None
    if not user or not user.is_active:
        raise AppError(401, "NO_SESSION", "Log in to continue.")
    return sign_in(user, response)


@router.post("/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path=COOKIE_PATH)


def new_user(db: Session, body: AccountFields, role: Role) -> User:
    email = body.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise AppError(409, "EMAIL_TAKEN", "An account with this email already exists.")
    if body.phone and db.scalar(select(User.id).where(User.phone == body.phone)):
        raise AppError(409, "PHONE_TAKEN", "An account with this phone number already exists.")
    return User(
        name=body.name,
        email=email,
        phone=body.phone,
        city=body.city,
        role=role,
        password_hash=hash_password(body.password),
    )


def save(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError(409, "ALREADY_EXISTS", "An account with these details already exists.") from None


def sign_in(user: User, response: Response) -> TokenResponse:
    response.set_cookie(
        COOKIE_NAME,
        create_refresh_token(user),
        max_age=settings.REFRESH_TOKEN_DAYS * 24 * 60 * 60,
        path=COOKIE_PATH,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
    )
    return TokenResponse(access_token=create_access_token(user), user=UserOut.model_validate(user))
