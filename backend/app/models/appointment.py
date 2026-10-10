import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.doctor import Doctor
from app.models.user import User, utcnow


class AppointmentStatus(enum.StrEnum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


ACTIVE_STATUSES = {AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS}


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (UniqueConstraint("doctor_id", "active_slot", name="uq_appointments_doctor_active_slot"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime)
    end_time: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus, values_callable=lambda e: [m.value for m in e]),
        default=AppointmentStatus.SCHEDULED,
    )
    active_slot: Mapped[datetime | None] = mapped_column(DateTime)
    reason: Mapped[str | None] = mapped_column(String(500))
    fee: Mapped[int]
    cancel_reason: Mapped[str | None] = mapped_column(String(500))
    cancelled_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    patient: Mapped[User] = relationship(foreign_keys=[patient_id], lazy="joined")
    doctor: Mapped[Doctor] = relationship(lazy="joined")

    def set_status(self, status: AppointmentStatus) -> None:
        self.status = status
        self.active_slot = self.start_time if status in ACTIVE_STATUSES else None
