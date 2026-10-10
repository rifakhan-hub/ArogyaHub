from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.models.doctor import Doctor, VerificationStatus
from app.schemas.auth import AccountFields
from app.schemas.common import as_utc, blank_to_none

PROFILE_FIELDS = {
    "specialization",
    "license_number",
    "council",
    "experience_years",
    "consultation_fee",
    "qualifications",
    "bio",
}


class DoctorProfileIn(BaseModel):
    specialization: str = Field(min_length=2, max_length=100)
    license_number: str = Field(min_length=3, max_length=50)
    council: str = Field(min_length=2, max_length=120)
    experience_years: int = Field(ge=0, le=60)
    consultation_fee: int = Field(ge=0, le=100_000)
    qualifications: str = Field(min_length=2, max_length=255)
    bio: str | None = Field(default=None, max_length=2000)

    @field_validator("specialization", "license_number", "council", "qualifications", "bio", mode="before")
    @classmethod
    def strip_profile(cls, value):
        return blank_to_none(value)


class DoctorRegisterRequest(AccountFields, DoctorProfileIn):
    pass


class DoctorOut(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    phone: str | None
    city: str | None
    is_active: bool
    specialization: str
    license_number: str
    council: str
    experience_years: int
    consultation_fee: int
    qualifications: str
    bio: str | None
    verification_status: VerificationStatus
    rejection_reason: str | None
    submitted_at: datetime
    reviewed_at: datetime | None

    @field_validator("submitted_at", "reviewed_at")
    @classmethod
    def utc(cls, value):
        return as_utc(value)

    @classmethod
    def from_doctor(cls, doctor: Doctor) -> "DoctorOut":
        user = doctor.user
        return cls(
            id=str(doctor.id),
            user_id=str(user.id),
            name=user.name,
            email=user.email,
            phone=user.phone,
            city=user.city,
            is_active=user.is_active,
            **{field: getattr(doctor, field) for field in PROFILE_FIELDS},
            verification_status=doctor.verification_status,
            rejection_reason=doctor.rejection_reason,
            submitted_at=doctor.submitted_at,
            reviewed_at=doctor.reviewed_at,
        )


class VerifyRequest(BaseModel):
    action: Literal["approve", "reject"]
    reason: str | None = Field(default=None, max_length=500)
