from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.models.patient import Patient
from app.models.user import User
from app.schemas.common import blank_to_none
from app.schemas.user import UserOut

Gender = Literal["female", "male", "other"]
BloodGroup = Literal["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]


class PatientUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    phone: str | None = Field(default=None, pattern=r"^\+?[0-9]{10,15}$")
    city: str | None = Field(default=None, max_length=100)
    date_of_birth: date | None = None
    gender: Gender | None = None
    blood_group: BloodGroup | None = None
    allergies: str | None = Field(default=None, max_length=500)

    @field_validator("name", "phone", "city", "gender", "blood_group", "allergies", "date_of_birth", mode="before")
    @classmethod
    def strip(cls, value):
        return blank_to_none(value)

    @field_validator("date_of_birth")
    @classmethod
    def not_in_future(cls, value: date | None):
        if value and value > date.today():
            raise ValueError("Date of birth can't be in the future")
        return value


class PatientOut(UserOut):
    date_of_birth: date | None = None
    gender: Gender | None = None
    blood_group: BloodGroup | None = None
    allergies: str | None = None

    @classmethod
    def build(cls, user: User, patient: Patient | None) -> "PatientOut":
        profile = {}
        if patient:
            profile = {
                "date_of_birth": patient.date_of_birth,
                "gender": patient.gender,
                "blood_group": patient.blood_group,
                "allergies": patient.allergies,
            }
        return cls(**UserOut.model_validate(user).model_dump(), **profile)
