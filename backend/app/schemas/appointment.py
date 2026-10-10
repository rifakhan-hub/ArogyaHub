from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models import Appointment, AppointmentStatus
from app.schemas.common import as_utc, blank_to_none


class BookRequest(BaseModel):
    doctor_id: int
    start_time: datetime
    reason: str | None = Field(default=None, max_length=500)

    @field_validator("reason", mode="before")
    @classmethod
    def strip(cls, value):
        return blank_to_none(value)


class CancelRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


class AppointmentOut(BaseModel):
    id: str
    doctor_id: str
    doctor_name: str
    specialization: str
    patient_id: str
    patient_name: str
    start_time: datetime
    end_time: datetime
    status: AppointmentStatus
    reason: str | None
    fee: int
    cancel_reason: str | None
    created_at: datetime

    @field_validator("start_time", "end_time", "created_at")
    @classmethod
    def utc(cls, value):
        return as_utc(value)

    @classmethod
    def build(cls, appointment: Appointment) -> "AppointmentOut":
        return cls(
            id=str(appointment.id),
            doctor_id=str(appointment.doctor_id),
            doctor_name=appointment.doctor.user.name,
            specialization=appointment.doctor.specialization,
            patient_id=str(appointment.patient_id),
            patient_name=appointment.patient.name,
            start_time=appointment.start_time,
            end_time=appointment.end_time,
            status=appointment.status,
            reason=appointment.reason,
            fee=appointment.fee,
            cancel_reason=appointment.cancel_reason,
            created_at=appointment.created_at,
        )
