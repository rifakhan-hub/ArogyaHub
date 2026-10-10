from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db, verified_doctor
from app.core.errors import AppError
from app.models import Availability, Doctor
from app.schemas.availability import AvailabilityIn, AvailabilityOut

router = APIRouter(prefix="/doctors/me/availability", tags=["doctor availability"])


@router.get("", response_model=list[AvailabilityOut])
def list_my_hours(doctor: Doctor = Depends(verified_doctor), db: Session = Depends(get_db)):
    blocks = db.scalars(
        select(Availability)
        .where(Availability.doctor_id == doctor.id)
        .order_by(Availability.day_of_week, Availability.start_time)
    ).all()
    return [AvailabilityOut.build(b) for b in blocks]


@router.post("", response_model=AvailabilityOut, status_code=201)
def add_hours(body: AvailabilityIn, doctor: Doctor = Depends(verified_doctor), db: Session = Depends(get_db)):
    overlap = db.scalar(
        select(Availability.id).where(
            Availability.doctor_id == doctor.id,
            Availability.day_of_week == body.day_of_week,
            Availability.start_time < body.end_time,
            Availability.end_time > body.start_time,
        )
    )
    if overlap:
        raise AppError(409, "HOURS_OVERLAP", "These hours overlap hours you already have on that day.")

    block = Availability(doctor_id=doctor.id, **body.model_dump())
    db.add(block)
    db.commit()
    return AvailabilityOut.build(block)


@router.delete("/{block_id}", status_code=204)
def remove_hours(block_id: int, doctor: Doctor = Depends(verified_doctor), db: Session = Depends(get_db)):
    block = db.get(Availability, block_id)
    if not block or block.doctor_id != doctor.id:
        raise AppError(404, "NOT_FOUND", "We could not find those hours.")
    db.delete(block)
    db.commit()
