from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.common import blank_to_none
from app.schemas.user import UserOut


class AccountFields(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, pattern=r"^\+?[0-9]{10,15}$")
    city: str | None = Field(default=None, max_length=100)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name", "city", "phone", mode="before")
    @classmethod
    def strip_account(cls, value):
        return blank_to_none(value)


class RegisterRequest(AccountFields):
    pass


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserOut
