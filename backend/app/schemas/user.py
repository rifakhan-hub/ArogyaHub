from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.user import Role
from app.schemas.common import as_utc


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
    def utc(cls, value):
        return as_utc(value)


class BlockUserRequest(BaseModel):
    blocked: bool
    reason: str | None = Field(default=None, max_length=500)
