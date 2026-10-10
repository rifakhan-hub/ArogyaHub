from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models import Appointment, Doctor, User, VerificationStatus


def find_my_appointment(db: Session, appointment_id: int, user: User) -> Appointment:
    appointment = db.get(Appointment, appointment_id)
    mine = appointment and (appointment.patient_id == user.id or appointment.doctor.user_id == user.id)
    if not mine:
        raise AppError(404, "NOT_FOUND", "We could not find that appointment.")
    return appointment


def find_listed_doctor(db: Session, doctor_id: int) -> Doctor:
    doctor = db.get(Doctor, doctor_id)
    if not doctor or doctor.verification_status != VerificationStatus.VERIFIED or not doctor.user.is_active:
        raise AppError(404, "NOT_FOUND", "We could not find that doctor.")
    return doctor
