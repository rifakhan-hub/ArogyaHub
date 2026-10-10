from datetime import UTC, date, datetime, time, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Appointment, Availability

IST = timezone(timedelta(hours=5, minutes=30))


def to_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value
    return value.astimezone(UTC).replace(tzinfo=None)


def ist_date(utc_value: datetime) -> date:
    return utc_value.replace(tzinfo=UTC).astimezone(IST).date()


def free_slots(
    blocks: list[Availability], day: date, taken: set[datetime], now: datetime
) -> list[tuple[datetime, datetime]]:
    slots = []
    for block in sorted(blocks, key=lambda b: b.start_time):
        if block.day_of_week != day.weekday():
            continue
        step = timedelta(minutes=block.slot_minutes)
        start = to_utc(datetime.combine(day, block.start_time, IST))
        end = to_utc(datetime.combine(day, block.end_time, IST))
        while start + step <= end:
            if start > now and start not in taken:
                slots.append((start, start + step))
            start += step
    return slots


def taken_slots(db: Session, doctor_id: int, day: date) -> set[datetime]:
    day_start = to_utc(datetime.combine(day, time.min, IST))
    return set(
        db.scalars(
            select(Appointment.active_slot).where(
                Appointment.doctor_id == doctor_id,
                Appointment.active_slot >= day_start,
                Appointment.active_slot < day_start + timedelta(days=1),
            )
        ).all()
    )
