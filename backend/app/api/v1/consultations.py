from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import current_doctor, get_current_user, get_db
from app.core.errors import AppError
from app.models import Appointment, AppointmentStatus, Consultation, ConsultationReport, Doctor, User
from app.models.user import utcnow
from app.schemas.consultation import ConsultationOut, ConsultationReportIn, ConsultationReportOut
from app.services.appointments import find_my_appointment

router = APIRouter(prefix="/appointments/{appointment_id}/consultation", tags=["consultations"])

JOIN_EARLY = timedelta(minutes=10)


@router.post("/start", response_model=ConsultationOut, status_code=201)
def start(appointment_id: int, doctor: Doctor = Depends(current_doctor), db: Session = Depends(get_db)):
    appointment = find_my_appointment(db, appointment_id, doctor.user)
    if appointment.status != AppointmentStatus.SCHEDULED:
        raise AppError(409, "CANNOT_START", "This consultation can't be started.")
    now = utcnow()
    if not appointment.start_time - JOIN_EARLY <= now <= appointment.end_time:
        raise AppError(403, "OUTSIDE_JOIN_WINDOW", "You can start 10 minutes before the booked time, until it ends.")

    consultation = Consultation(appointment_id=appointment.id, started_at=now)
    appointment.set_status(AppointmentStatus.IN_PROGRESS)
    db.add(consultation)
    db.commit()
    return ConsultationOut.build(consultation)


@router.post("/end", response_model=ConsultationOut)
def end(appointment_id: int, doctor: Doctor = Depends(current_doctor), db: Session = Depends(get_db)):
    appointment = find_my_appointment(db, appointment_id, doctor.user)
    consultation = find_consultation(db, appointment)
    if consultation.ended_at:
        raise AppError(409, "ALREADY_ENDED", "This consultation has already ended.")

    consultation.ended_at = utcnow()
    appointment.set_status(AppointmentStatus.COMPLETED)
    db.commit()
    return ConsultationOut.build(consultation)


@router.get("", response_model=ConsultationOut)
def get_consultation(appointment_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    appointment = find_my_appointment(db, appointment_id, user)
    return ConsultationOut.build(find_consultation(db, appointment))


@router.put("/report", response_model=ConsultationReportOut)
def write_report(
    appointment_id: int,
    body: ConsultationReportIn,
    doctor: Doctor = Depends(current_doctor),
    db: Session = Depends(get_db),
):
    appointment = find_my_appointment(db, appointment_id, doctor.user)
    consultation = find_consultation(db, appointment)
    report = db.scalar(select(ConsultationReport).where(ConsultationReport.consultation_id == consultation.id))
    if not report:
        report = ConsultationReport(consultation_id=consultation.id)
        db.add(report)
    for field, value in body.model_dump().items():
        setattr(report, field, value)
    report.updated_at = utcnow()
    db.commit()
    return ConsultationReportOut.build(report)


@router.get("/report", response_model=ConsultationReportOut)
def read_report(appointment_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    appointment = find_my_appointment(db, appointment_id, user)
    consultation = find_consultation(db, appointment)
    report = db.scalar(select(ConsultationReport).where(ConsultationReport.consultation_id == consultation.id))
    if not report:
        raise AppError(404, "NO_REPORT", "The doctor hasn't written the consultation report yet.")
    return ConsultationReportOut.build(report)


def find_consultation(db: Session, appointment: Appointment) -> Consultation:
    consultation = db.scalar(select(Consultation).where(Consultation.appointment_id == appointment.id))
    if not consultation:
        raise AppError(404, "NOT_STARTED", "This consultation hasn't started yet.")
    return consultation
