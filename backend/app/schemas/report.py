from datetime import datetime

from pydantic import BaseModel, field_validator

from app.models import Report, ReportShare, ReportType, User
from app.schemas.common import as_utc


class ShareOut(BaseModel):
    doctor_id: str
    doctor_name: str
    shared_at: datetime

    @field_validator("shared_at")
    @classmethod
    def utc(cls, value):
        return as_utc(value)


class ReportOut(BaseModel):
    id: str
    title: str
    report_type: ReportType
    file_name: str
    content_type: str
    size: int
    uploaded_at: datetime
    shared_with: list[ShareOut]

    @field_validator("uploaded_at")
    @classmethod
    def utc(cls, value):
        return as_utc(value)

    @classmethod
    def build(cls, report: Report) -> "ReportOut":
        return cls(
            id=str(report.id),
            title=report.title,
            report_type=report.report_type,
            file_name=report.file_name,
            content_type=report.content_type,
            size=report.size,
            uploaded_at=report.uploaded_at,
            shared_with=[
                ShareOut(doctor_id=str(s.doctor_id), doctor_name=s.doctor.user.name, shared_at=s.shared_at)
                for s in report.shares
            ],
        )


class SharedReportOut(BaseModel):
    id: str
    title: str
    report_type: ReportType
    file_name: str
    size: int
    patient_id: str
    patient_name: str
    shared_at: datetime

    @field_validator("shared_at")
    @classmethod
    def utc(cls, value):
        return as_utc(value)

    @classmethod
    def build(cls, report: Report, patient: User, share: ReportShare) -> "SharedReportOut":
        return cls(
            id=str(report.id),
            title=report.title,
            report_type=report.report_type,
            file_name=report.file_name,
            size=report.size,
            patient_id=str(patient.id),
            patient_name=patient.name,
            shared_at=share.shared_at,
        )


class ShareRequest(BaseModel):
    doctor_id: int
