from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.errors import AppError
from app.core.security import hash_password
from app.models.user import Role, User
from app.schemas.user import RegisterRequest, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserOut, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise AppError(409, "EMAIL_TAKEN", "An account with this email already exists.")
    if body.phone and db.scalar(select(User.id).where(User.phone == body.phone)):
        raise AppError(409, "PHONE_TAKEN", "An account with this phone number already exists.")

    user = User(
        name=body.name,
        email=email,
        phone=body.phone,
        city=body.city,
        role=Role(body.role),
        password_hash=hash_password(body.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError(409, "EMAIL_TAKEN", "An account with this email or phone number already exists.") from None
    return UserOut.model_validate(user)
