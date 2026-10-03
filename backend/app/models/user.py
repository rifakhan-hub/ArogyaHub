"""The users table: one row per account."""

import enum
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def utcnow() -> datetime:
    """The current time in UTC, without a timezone attached, because MySQL DATETIME columns don't store one."""
    return datetime.now(UTC).replace(tzinfo=None)


class Role(enum.StrEnum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True)
    city: Mapped[str | None] = mapped_column(String(100))
    # stores "patient", not "PATIENT"
    role: Mapped[Role] = mapped_column(Enum(Role, values_callable=lambda e: [m.value for m in e]))
    is_active: Mapped[bool] = mapped_column(default=True)
    is_email_verified: Mapped[bool] = mapped_column(default=False)
    blocked_reason: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime)
