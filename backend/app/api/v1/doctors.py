from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.deps import current_doctor, get_db, require_doctor
from app.core.errors import AppError
from app.db.pagination import paginate
from app.models import Availability, Doctor, User, VerificationStatus
from app.models.user import utcnow
from app.schemas.availability import DoctorCard, SlotOut
from app.schemas.common import Page
from app.schemas.doctor import DoctorOut, DoctorProfileIn
from app.services.appointments import find_listed_doctor
from app.services.slots import free_slots, taken_slots

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("/me", response_model=DoctorOut)
def get_my_profile(doctor: Doctor = Depends(current_doctor)):
    return DoctorOut.from_doctor(doctor)


@router.put("/me", response_model=DoctorOut)
def update_my_profile(body: DoctorProfileIn, user: User = Depends(require_doctor), db: Session = Depends(get_db)):
    doctor = db.scalar(select(Doctor).where(Doctor.user_id == user.id))
    taken = db.scalar(
        select(Doctor.user_id).where(Doctor.license_number == body.license_number, Doctor.user_id != user.id)
    )
    if taken:
        raise AppError(409, "LICENSE_TAKEN", "Another doctor has already registered this licence number.")

    if not doctor:
        doctor = Doctor(user=user, **body.model_dump())
        db.add(doctor)
        db.commit()
        return DoctorOut.from_doctor(doctor)

    licence_changed = (body.license_number, body.council) != (doctor.license_number, doctor.council)
    for field, value in body.model_dump().items():
        setattr(doctor, field, value)

    if doctor.verification_status == VerificationStatus.REJECTED or licence_changed:
        doctor.verification_status = VerificationStatus.PENDING
        doctor.rejection_reason = None
        doctor.submitted_at = utcnow()

    db.commit()
    return DoctorOut.from_doctor(doctor)


@router.get("", response_model=Page[DoctorCard])
def list_doctors(
    q: str | None = None,
    specialization: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = (
        select(Doctor)
        .join(Doctor.user)
        .where(Doctor.verification_status == VerificationStatus.VERIFIED, User.is_active.is_(True))
    )
    if specialization:
        query = query.where(Doctor.specialization == specialization)
    if q:
        q = q.strip()
        query = query.where(or_(User.name.icontains(q), Doctor.specialization.icontains(q)))
    query = query.order_by(User.name, Doctor.id)

    doctors, total = paginate(db, query, page, page_size)
    return Page(items=[DoctorCard.build(d) for d in doctors], total=total, page=page, page_size=page_size)


@router.get("/{doctor_id}", response_model=DoctorCard)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    return DoctorCard.build(find_listed_doctor(db, doctor_id))


@router.get("/{doctor_id}/slots", response_model=list[SlotOut])
def get_free_slots(doctor_id: int, day: date = Query(alias="date"), db: Session = Depends(get_db)):
    doctor = find_listed_doctor(db, doctor_id)
    blocks = db.scalars(select(Availability).where(Availability.doctor_id == doctor.id)).all()
    slots = free_slots(blocks, day, taken_slots(db, doctor.id, day), utcnow())
    return [SlotOut(start=start, end=end) for start, end in slots]
