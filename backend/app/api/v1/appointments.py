from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import current_doctor, get_current_user, get_db, require_patient
from app.core.errors import AppError
from app.models import ACTIVE_STATUSES, Appointment, AppointmentStatus, Availability, Doctor, Role, User
from app.models.user import utcnow
from app.schemas.appointment import AppointmentOut, BookRequest, CancelRequest
from app.services.appointments import find_listed_doctor, find_my_appointment
from app.services.slots import free_slots, ist_date, taken_slots, to_utc

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("", response_model=AppointmentOut, status_code=201)
def book(body: BookRequest, patient: User = Depends(require_patient), db: Session = Depends(get_db)):
    doctor = find_listed_doctor(db, body.doctor_id)
    start = to_utc(body.start_time)
    day = ist_date(start)

    blocks = db.scalars(select(Availability).where(Availability.doctor_id == doctor.id)).all()
    slots = dict(free_slots(blocks, day, taken_slots(db, doctor.id, day), utcnow()))
    if start not in slots:
        raise AppError(409, "SLOT_NOT_AVAILABLE", "This time isn't free any more. Pick another slot.")
    end = slots[start]

    busy = db.scalar(
        select(Appointment.id).where(
            Appointment.patient_id == patient.id,
            Appointment.status.in_(ACTIVE_STATUSES),
            Appointment.start_time < end,
            Appointment.end_time > start,
        )
    )
    if busy:
        raise AppError(409, "PATIENT_BUSY", "You already have a consultation at this time.")

    appointment = Appointment(
        patient_id=patient.id,
        doctor_id=doctor.id,
        start_time=start,
        end_time=end,
        reason=body.reason,
        fee=doctor.consultation_fee,
    )
    appointment.set_status(AppointmentStatus.SCHEDULED)
    db.add(appointment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError(409, "SLOT_NOT_AVAILABLE", "This time was just booked. Pick another slot.") from None
    return AppointmentOut.build(appointment)


@router.get("/me", response_model=list[AppointmentOut])
def my_appointments(
    status: AppointmentStatus | None = None,
    upcoming: bool | None = Query(None, description="true: from now on, false: before now"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = select(Appointment)
    if user.role == Role.PATIENT:
        query = query.where(Appointment.patient_id == user.id)
    elif user.role == Role.DOCTOR:
        query = query.join(Appointment.doctor).where(Doctor.user_id == user.id)
    else:
        raise AppError(403, "FORBIDDEN", "Only patients and doctors have appointments.")

    if status:
        query = query.where(Appointment.status == status)
    if upcoming is not None:
        now = utcnow()
        query = query.where(Appointment.end_time >= now if upcoming else Appointment.end_time < now)

    appointments = db.scalars(query.order_by(Appointment.start_time)).unique().all()
    return [AppointmentOut.build(a) for a in appointments]


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return AppointmentOut.build(find_my_appointment(db, appointment_id, user))


@router.post("/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel(
    appointment_id: int,
    body: CancelRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointment = find_my_appointment(db, appointment_id, user)
    if appointment.status != AppointmentStatus.SCHEDULED or appointment.start_time <= utcnow():
        raise AppError(409, "CANNOT_CANCEL", "Only upcoming consultations can be cancelled.")

    appointment.set_status(AppointmentStatus.CANCELLED)
    appointment.cancel_reason = (body.reason or "").strip() or None
    appointment.cancelled_by = user.id
    db.commit()
    return AppointmentOut.build(appointment)


@router.post("/{appointment_id}/no-show", response_model=AppointmentOut)
def mark_no_show(appointment_id: int, doctor: Doctor = Depends(current_doctor), db: Session = Depends(get_db)):
    appointment = find_my_appointment(db, appointment_id, doctor.user)
    if appointment.status != AppointmentStatus.SCHEDULED or appointment.start_time > utcnow():
        raise AppError(409, "CANNOT_MARK_NO_SHOW", "You can mark a no-show only after the start time.")
    appointment.set_status(AppointmentStatus.NO_SHOW)
    db.commit()
    return AppointmentOut.build(appointment)
