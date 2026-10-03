"""What the users endpoints send and receive. The shapes match frontend/src/api/types.ts."""

from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.user import Role


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # lets UserOut.model_validate(user) read a User row

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
        # dates are stored in UTC without a timezone; mark them as UTC so the browser converts them correctly
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
