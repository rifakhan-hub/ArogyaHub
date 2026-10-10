from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_doctor
from app.core.errors import AppError
from app.models import Doctor, User, VerificationStatus
from app.models.user import utcnow
from app.schemas.doctor import DoctorOut, DoctorProfileIn

router = APIRouter(prefix="/doctors", tags=["doctors"])


def find_profile(db: Session, user: User) -> Doctor | None:
    return db.scalar(select(Doctor).where(Doctor.user_id == user.id))


@router.get("/me", response_model=DoctorOut)
def get_my_profile(user: User = Depends(require_doctor), db: Session = Depends(get_db)):
    doctor = find_profile(db, user)
    if not doctor:
        raise AppError(404, "NO_DOCTOR_PROFILE", "Finish your doctor profile so an admin can review it.")
    return DoctorOut.from_doctor(doctor)


@router.put("/me", response_model=DoctorOut)
def update_my_profile(body: DoctorProfileIn, user: User = Depends(require_doctor), db: Session = Depends(get_db)):
    doctor = find_profile(db, user)
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
