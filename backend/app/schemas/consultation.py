from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.models import Consultation, ConsultationReport
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


class ConsultationReportIn(BaseModel):
    symptoms: str | None = Field(default=None, max_length=5000)
    diagnosis: str = Field(min_length=2, max_length=5000)
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

    @field_validator("updated_at")
    @classmethod
    def utc(cls, value):
        return as_utc(value)

    @classmethod
    def build(cls, report: ConsultationReport) -> "ConsultationReportOut":
        return cls(
            id=str(report.id),
            consultation_id=str(report.consultation_id),
            symptoms=report.symptoms,
            diagnosis=report.diagnosis,
            prescription=report.prescription,
            advice=report.advice,
            follow_up_date=report.follow_up_date,
            updated_at=report.updated_at,
        )
