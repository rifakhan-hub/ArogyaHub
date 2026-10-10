from datetime import datetime, time
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models import Availability, Doctor
from app.schemas.common import as_utc


class AvailabilityIn(BaseModel):
    day_of_week: int = Field(ge=0, le=6, description="0 is Monday, 6 is Sunday")
    start_time: time
    end_time: time
    slot_minutes: Literal[5, 10, 15, 20, 30]

    @model_validator(mode="after")
    def end_after_start(self):
        if self.end_time <= self.start_time:
            raise ValueError("The end time must be after the start time")
        return self


class AvailabilityOut(BaseModel):
    id: str
    day_of_week: int
    start_time: time
    end_time: time
    slot_minutes: int

    @classmethod
    def build(cls, block: Availability) -> "AvailabilityOut":
        return cls(
            id=str(block.id),
            day_of_week=block.day_of_week,
            start_time=block.start_time,
            end_time=block.end_time,
            slot_minutes=block.slot_minutes,
        )


class SlotOut(BaseModel):
    start: datetime
    end: datetime

    @field_validator("start", "end")
    @classmethod
    def utc(cls, value):
        return as_utc(value)


class DoctorCard(BaseModel):
    id: str
    name: str
    city: str | None
    specialization: str
    qualifications: str
    experience_years: int
    consultation_fee: int
    bio: str | None

    @classmethod
    def build(cls, doctor: Doctor) -> "DoctorCard":
        return cls(
            id=str(doctor.id),
            name=doctor.user.name,
            city=doctor.user.city,
            specialization=doctor.specialization,
            qualifications=doctor.qualifications,
            experience_years=doctor.experience_years,
            consultation_fee=doctor.consultation_fee,
            bio=doctor.bio,
        )
