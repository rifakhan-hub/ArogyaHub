from datetime import time

from sqlalchemy import ForeignKey, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Availability(Base):
    __tablename__ = "doctor_availability"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), index=True)
    day_of_week: Mapped[int]
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    slot_minutes: Mapped[int]
