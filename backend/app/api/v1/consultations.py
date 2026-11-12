import asyncio

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import current_doctor, get_current_user, get_db
from app.core.errors import AppError
from app.models import (
    ACTIVE_STATUSES,
    Appointment,
    AppointmentStatus,
    Consultation,
    ConsultationMedicine,
    ConsultationReport,
    Doctor,
    Patient,
    User,
)
from app.models.user import utcnow
from app.schemas.consultation import CallOut, ConsultationOut, ConsultationReportIn, ConsultationReportOut
from app.services import calls
from app.services.appointments import find_my_appointment
from app.services.calls import JOIN_EARLY, JOIN_GRACE

router = APIRouter(prefix="/appointments/{appointment_id}/consultation", tags=["consultations"])


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


@router.post("/join", response_model=CallOut)
def join_call(appointment_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    appointment = find_my_appointment(db, appointment_id, user)
    if appointment.status not in ACTIVE_STATUSES:
        raise AppError(409, "CALL_CLOSED", "This consultation is over.")
    if not appointment.start_time - JOIN_EARLY <= utcnow() <= appointment.end_time + JOIN_GRACE:
        raise AppError(403, "OUTSIDE_JOIN_WINDOW", "You can join from 10 minutes before the booked time.")

    is_doctor = appointment.doctor.user_id == user.id
    if appointment.status == AppointmentStatus.SCHEDULED:
        if is_doctor:
            raise AppError(409, "NOT_STARTED", "Start the consultation first.")
        return CallOut(status=appointment.status, waiting=True)
    return CallOut(status=appointment.status, waiting=False, ice_servers=calls.ice_servers())


@router.websocket("/signal")
async def signal(websocket: WebSocket, appointment_id: int, db: Session = Depends(get_db)):
    await websocket.accept()
    try:
        hello = await asyncio.wait_for(websocket.receive_json(), timeout=10)
        role = calls.caller_role(db, appointment_id, hello.get("token") if isinstance(hello, dict) else None)
    except calls.CallRefused as refused:
        await websocket.close(refused.code, refused.reason)
        return
    except WebSocketDisconnect:
        return
    except (TimeoutError, ValueError):
        await websocket.close(4401, "Log in again to join the call.")
        return
    finally:
        db.close()

    await calls.enter(appointment_id, role, websocket)
    try:
        while True:
            await calls.relay(appointment_id, role, await websocket.receive_json())
    except (WebSocketDisconnect, ValueError):
        pass
    finally:
        await calls.leave(appointment_id, role, websocket)


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
    for field, value in body.model_dump(exclude={"medicines"}).items():
        setattr(report, field, value)
    report.medicines = [ConsultationMedicine(position=i, **m.model_dump()) for i, m in enumerate(body.medicines)]
    report.updated_at = utcnow()
    db.commit()
    return report_out(db, appointment, report)


@router.get("/report", response_model=ConsultationReportOut)
def read_report(appointment_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    appointment = find_my_appointment(db, appointment_id, user)
    consultation = find_consultation(db, appointment)
    report = db.scalar(select(ConsultationReport).where(ConsultationReport.consultation_id == consultation.id))
    if not report:
        raise AppError(404, "NO_REPORT", "The doctor hasn't written the consultation report yet.")
    return report_out(db, appointment, report)


def find_consultation(db: Session, appointment: Appointment) -> Consultation:
    consultation = db.scalar(select(Consultation).where(Consultation.appointment_id == appointment.id))
    if not consultation:
        raise AppError(404, "NOT_STARTED", "This consultation hasn't started yet.")
    return consultation


def report_out(db: Session, appointment: Appointment, report: ConsultationReport) -> ConsultationReportOut:
    profile = db.scalar(select(Patient).where(Patient.user_id == appointment.patient_id))
    return ConsultationReportOut.build(report, appointment, profile)
