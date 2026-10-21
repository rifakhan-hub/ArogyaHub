from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.user import utcnow


class DicomStudy(Base):
    __tablename__ = "dicom_studies"

    id: Mapped[int] = mapped_column(primary_key=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id"), unique=True)
    study_uid: Mapped[str] = mapped_column(String(64))
    study_date: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(String(200))
    modality: Mapped[str | None] = mapped_column(String(16))
    body_part: Mapped[str | None] = mapped_column(String(64))
    series_count: Mapped[int]
    instance_count: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    series: Mapped[list["DicomSeries"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin", order_by="DicomSeries.series_number"
    )


class DicomSeries(Base):
    __tablename__ = "dicom_series"
    __table_args__ = (UniqueConstraint("study_id", "series_uid", name="uq_dicom_series_study_uid"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    study_id: Mapped[int] = mapped_column(ForeignKey("dicom_studies.id"), index=True)
    series_uid: Mapped[str] = mapped_column(String(64))
    series_number: Mapped[int | None]
    modality: Mapped[str | None] = mapped_column(String(16))
    body_part: Mapped[str | None] = mapped_column(String(64))
    description: Mapped[str | None] = mapped_column(String(200))
    instance_count: Mapped[int]

    instances: Mapped[list["DicomInstance"]] = relationship(
        cascade="all, delete-orphan", order_by="DicomInstance.instance_number"
    )


class DicomInstance(Base):
    __tablename__ = "dicom_instances"

    id: Mapped[int] = mapped_column(primary_key=True)
    series_id: Mapped[int] = mapped_column(ForeignKey("dicom_series.id"), index=True)
    sop_uid: Mapped[str] = mapped_column(String(64))
    instance_number: Mapped[int | None]
    rows: Mapped[int | None]
    columns: Mapped[int | None]
    zip_entry: Mapped[str | None] = mapped_column(String(255))
