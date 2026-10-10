from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_patient
from app.core.errors import AppError
from app.models import Patient, User
from app.schemas.patient import PatientOut, PatientUpdate

router = APIRouter(prefix="/patients", tags=["patients"])


def my_profile(db: Session, user: User) -> Patient:
    patient = db.scalar(select(Patient).where(Patient.user_id == user.id))
    if not patient:
        patient = Patient(user_id=user.id)
        db.add(patient)
        db.commit()
    return patient


@router.get("/me", response_model=PatientOut)
def get_my_profile(user: User = Depends(require_patient), db: Session = Depends(get_db)):
    return PatientOut.build(user, my_profile(db, user))


@router.put("/me", response_model=PatientOut)
def update_my_profile(body: PatientUpdate, user: User = Depends(require_patient), db: Session = Depends(get_db)):
    if body.phone and db.scalar(select(User.id).where(User.phone == body.phone, User.id != user.id)):
        raise AppError(409, "PHONE_TAKEN", "Another account already uses this phone number.")

    patient = my_profile(db, user)
    user.name = body.name
    user.phone = body.phone
    user.city = body.city
    patient.date_of_birth = body.date_of_birth
    patient.gender = body.gender
    patient.blood_group = body.blood_group
    patient.allergies = body.allergies
    db.commit()
    return PatientOut.build(user, patient)
