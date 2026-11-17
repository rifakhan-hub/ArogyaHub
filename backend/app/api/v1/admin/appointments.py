from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, aliased

from app.core.deps import get_db, require_admin
from app.core.errors import AppError
from app.db.pagination import paginate
from app.models import Appointment, AppointmentStatus, Consultation, ConsultationReport, Doctor, Patient, User
from app.schemas.appointment import AppointmentOut
from app.schemas.common import Page
from app.schemas.consultation import AppointmentDetailOut, ConsultationOut, ConsultationReportOut
from app.services.slots import IST, to_utc

router = APIRouter(prefix="/admin/appointments", tags=["admin: appointments"], dependencies=[Depends(require_admin)])


@router.get("/summary", response_model=dict[str, int])
def summary(db: Session = Depends(get_db)):
    counts = dict(db.execute(select(Appointment.status, func.count()).group_by(Appointment.status)).all())
    result = {status.value: counts.get(status, 0) for status in AppointmentStatus}
    result["total"] = sum(result.values())
    return result


@router.get("", response_model=Page[AppointmentOut])
def list_appointments(
    q: str | None = None,
    status: AppointmentStatus | None = None,
    day: date | None = Query(None, alias="date"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    patient = aliased(User)
    doctor_user = aliased(User)
    query = (
        select(Appointment)
        .join(patient, patient.id == Appointment.patient_id)
        .join(Doctor, Doctor.id == Appointment.doctor_id)
        .join(doctor_user, doctor_user.id == Doctor.user_id)
    )
    if q:
        q = q.strip()
        query = query.where(or_(patient.name.icontains(q), doctor_user.name.icontains(q)))
    if status:
        query = query.where(Appointment.status == status)
    if day:
        start = to_utc(datetime.combine(day, time.min, IST))
        query = query.where(Appointment.start_time >= start, Appointment.start_time < start + timedelta(days=1))
    query = query.order_by(Appointment.start_time.desc(), Appointment.id.desc())

    appointments, total = paginate(db, query, page, page_size)
    return Page(items=[AppointmentOut.build(a) for a in appointments], total=total, page=page, page_size=page_size)


@router.get("/{appointment_id}", response_model=AppointmentDetailOut)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise AppError(404, "NOT_FOUND", "We could not find that appointment.")

    consultation = db.scalar(select(Consultation).where(Consultation.appointment_id == appointment.id))
    report = None
    if consultation:
        saved = db.scalar(select(ConsultationReport).where(ConsultationReport.consultation_id == consultation.id))
        if saved:
            profile = db.scalar(select(Patient).where(Patient.user_id == appointment.patient_id))
            report = ConsultationReportOut.build(saved, appointment, profile)

    return AppointmentDetailOut(
        appointment=AppointmentOut.build(appointment),
        consultation=ConsultationOut.build(consultation) if consultation else None,
        report=report,
    )
