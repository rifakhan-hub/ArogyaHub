from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.models import Appointment, Consultation, ConsultationMedicine, ConsultationReport, Patient
from app.schemas.common import as_utc, blank_to_none


class ConsultationOut(BaseModel):
    id: str
    appointment_id: str
    started_at: datetime
    ended_at: datetime | None

    @field_validator("started_at", "ended_at")
    @classmethod
    def utc(cls, value):
        return as_utc(value)

    @classmethod
    def build(cls, consultation: Consultation) -> "ConsultationOut":
        return cls(
            id=str(consultation.id),
            appointment_id=str(consultation.appointment_id),
            started_at=consultation.started_at,
            ended_at=consultation.ended_at,
        )


class MedicineIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    dose: str | None = Field(default=None, max_length=60)
    frequency: str = Field(min_length=1, max_length=60)
    days: int | None = Field(default=None, ge=1, le=365)
    notes: str | None = Field(default=None, max_length=200)

    @field_validator("name", "dose", "frequency", "notes", mode="before")
    @classmethod
    def strip(cls, value):
        return blank_to_none(value)

    @classmethod
    def build(cls, medicine: ConsultationMedicine) -> "MedicineIn":
        return cls(
            name=medicine.name,
            dose=medicine.dose,
            frequency=medicine.frequency,
            days=medicine.days,
            notes=medicine.notes,
        )


class ConsultationReportIn(BaseModel):
    symptoms: str | None = Field(default=None, max_length=5000)
    diagnosis: str = Field(min_length=2, max_length=5000)
    medicines: list[MedicineIn] = Field(default_factory=list, max_length=20)
    prescription: str | None = Field(default=None, max_length=5000)
    advice: str | None = Field(default=None, max_length=5000)
    follow_up_date: date | None = None

    @field_validator("symptoms", "diagnosis", "prescription", "advice", "follow_up_date", mode="before")
    @classmethod
    def strip(cls, value):
        return blank_to_none(value)


class ConsultationReportOut(ConsultationReportIn):
    id: str
    consultation_id: str
    updated_at: datetime
    consulted_at: datetime
    doctor_name: str
    specialization: str
    doctor_qualifications: str
    doctor_registration: str
    patient_name: str
    patient_age: int | None
    patient_gender: str | None
    patient_allergies: str | None

    @field_validator("updated_at", "consulted_at")
    @classmethod
    def utc(cls, value):
        return as_utc(value)

    @classmethod
    def build(
        cls, report: ConsultationReport, appointment: Appointment, profile: Patient | None
    ) -> "ConsultationReportOut":
        doctor = appointment.doctor
        return cls(
            id=str(report.id),
            consultation_id=str(report.consultation_id),
            symptoms=report.symptoms,
            diagnosis=report.diagnosis,
            medicines=[MedicineIn.build(m) for m in report.medicines],
            prescription=report.prescription,
            advice=report.advice,
            follow_up_date=report.follow_up_date,
            updated_at=report.updated_at,
            consulted_at=appointment.start_time,
            doctor_name=doctor.user.name,
            specialization=doctor.specialization,
            doctor_qualifications=doctor.qualifications,
            doctor_registration=f"{doctor.license_number} · {doctor.council}",
            patient_name=appointment.patient.name,
            patient_age=age(profile.date_of_birth) if profile and profile.date_of_birth else None,
            patient_gender=profile.gender if profile else None,
            patient_allergies=profile.allergies if profile else None,
        )


def age(born: date, today: date | None = None) -> int:
    today = today or date.today()
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
