import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.doctor import Doctor
from app.models.user import utcnow


class ReportType(enum.StrEnum):
    PDF = "pdf"
    IMAGE = "image"
    DICOM = "dicom"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    report_type: Mapped[ReportType] = mapped_column(Enum(ReportType, values_callable=lambda e: [m.value for m in e]))
    file_name: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(100))
    size: Mapped[int]
    storage_path: Mapped[str] = mapped_column(String(500))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    shares: Mapped[list["ReportShare"]] = relationship(cascade="all, delete-orphan", lazy="selectin")


class ReportShare(Base):
    __tablename__ = "report_shares"
    __table_args__ = (UniqueConstraint("report_id", "doctor_id", name="uq_report_shares_report_doctor"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id"), index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), index=True)
    shared_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    doctor: Mapped[Doctor] = relationship(lazy="joined")
