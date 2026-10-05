from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.errors import AppError
from app.models.user import Role, User
from app.schemas.common import Page
from app.schemas.user import BlockUserRequest, UserDetail, UserOut

router = APIRouter(prefix="/admin/users", tags=["admin: users"])

SORT_COLUMNS = {
    "name": func.lower(func.replace(User.name, "Dr. ", "")),
    "created_at": User.created_at,
    "last_login_at": User.last_login_at,
    "role": User.role,
}

SortOption = Literal["name", "-name", "created_at", "-created_at", "last_login_at", "-last_login_at", "role", "-role"]


@router.get("", response_model=Page[UserOut])
def list_users(
    q: str | None = None,
    role: Role | None = None,
    status: Literal["active", "blocked"] | None = None,
    sort: SortOption = "-created_at",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = select(User)
    if q:
        q = q.strip()
        query = query.where(
            User.name.icontains(q) | User.email.icontains(q) | User.phone.icontains(q) | User.city.icontains(q)
        )
    if role:
        query = query.where(User.role == role)
    if status:
        query = query.where(User.is_active == (status == "active"))

    total = db.scalar(select(func.count()).select_from(query.subquery()))

    column = SORT_COLUMNS[sort.lstrip("-")]
    order = column.desc() if sort.startswith("-") else column.asc()
    users = db.scalars(query.order_by(order, User.id.desc()).offset((page - 1) * page_size).limit(page_size))

    return Page(items=[UserOut.model_validate(u) for u in users], total=total, page=page, page_size=page_size)


@router.get("/{user_id}", response_model=UserDetail)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return UserDetail.model_validate(find_user(db, user_id))


@router.patch("/{user_id}/block", response_model=UserOut)
def block_user(user_id: int, body: BlockUserRequest, db: Session = Depends(get_db)):
    user = find_user(db, user_id)
    if user.role == Role.ADMIN:
        raise AppError(403, "CANNOT_BLOCK_ADMIN", "Admin accounts can't be blocked from the console.")

    reason = (body.reason or "").strip()
    if body.blocked and len(reason) < 10:
        raise AppError(422, "VALIDATION_ERROR", "Give a reason of at least 10 characters.")

    user.is_active = not body.blocked
    user.blocked_reason = reason if body.blocked else None
    db.commit()
    return UserOut.model_validate(user)


def find_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if not user:
        raise AppError(404, "NOT_FOUND", "We couldn't find that user.")
    return user
