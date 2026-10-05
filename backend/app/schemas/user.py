from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import Role


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    phone: str | None
    city: str | None
    role: Role
    is_active: bool
    is_email_verified: bool
    blocked_reason: str | None
    created_at: datetime
    last_login_at: datetime | None

    @field_validator("id", mode="before")
    @classmethod
    def id_as_text(cls, value):
        return str(value)

    @field_validator("created_at", "last_login_at")
    @classmethod
    def as_utc(cls, value: datetime | None):
        return value.replace(tzinfo=UTC) if value and value.tzinfo is None else value


class UserStats(BaseModel):
    appointments: int = 0
    completed: int = 0
    cancelled: int = 0
    no_show: int = 0
    last_appointment_at: datetime | None = None


class UserDetail(UserOut):
    doctor_id: str | None = None
    verification_status: str | None = None
    stats: UserStats = UserStats()


class BlockUserRequest(BaseModel):
    blocked: bool
    reason: str | None = Field(default=None, max_length=500)


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, pattern=r"^\+?[0-9]{10,15}$")
    city: str | None = Field(default=None, max_length=100)
    role: Literal["patient", "doctor"]
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name", "city", "phone", mode="before")
    @classmethod
    def strip_blank(cls, value):
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value
