from datetime import timedelta

import pytest
from sqlalchemy import select

from app.models import Appointment, AppointmentStatus, Doctor, User
from app.models.user import utcnow
from tests.conftest import book_first_slot


def appointment_now(session, minutes_from_now: int = -5) -> str:
    with session() as db:
        patient = db.scalar(select(User).where(User.email == "priya@test.in"))
        doctor = db.scalar(select(Doctor).join(Doctor.user).where(User.email == "kapoor@test.in"))
        start = utcnow() + timedelta(minutes=minutes_from_now)
        appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doctor.id,
            start_time=start,
            end_time=start + timedelta(minutes=30),
            fee=500,
        )
        appointment.set_status(AppointmentStatus.SCHEDULED)
        db.add(appointment)
        db.commit()
        return str(appointment.id)


def url(appointment_id: str, path: str = "") -> str:
    return f"/api/v1/appointments/{appointment_id}/consultation{path}"


REPORT = {
    "symptoms": "Itchy rash on both arms for a week",
    "diagnosis": "Contact dermatitis",
    "prescription": "Cetirizine 10 mg at night for 5 days",
    "advice": "Avoid the new soap",
    "follow_up_date": "2030-01-15",
}


def test_start_and_end_a_consultation(session, verified, patient):
    appointment_id = appointment_now(session)
    started = verified.post(url(appointment_id, "/start"))
    assert started.status_code == 201
    assert patient.get(f"/api/v1/appointments/{appointment_id}").json()["status"] == "in_progress"
    assert patient.get(url(appointment_id)).json()["ended_at"] is None

    ended = verified.post(url(appointment_id, "/end"))
    assert ended.json()["ended_at"] is not None
    assert patient.get(f"/api/v1/appointments/{appointment_id}").json()["status"] == "completed"
    assert verified.post(url(appointment_id, "/end")).json()["error"]["code"] == "ALREADY_ENDED"


def test_cannot_start_outside_the_join_window(patient, verified):
    appointment = book_first_slot(patient, verified).json()
    res = verified.post(url(appointment["id"], "/start"))
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "OUTSIDE_JOIN_WINDOW"


def test_only_the_doctor_starts_it(session, patient):
    appointment_id = appointment_now(session)
    assert patient.post(url(appointment_id, "/start")).status_code == 403


def test_doctor_writes_and_patient_reads_the_report(session, verified, patient):
    appointment_id = appointment_now(session)
    assert verified.put(url(appointment_id, "/report"), json=REPORT).json()["error"]["code"] == "NOT_STARTED"

    verified.post(url(appointment_id, "/start"))
    assert patient.get(url(appointment_id, "/report")).json()["error"]["code"] == "NO_REPORT"

    res = verified.put(url(appointment_id, "/report"), json=REPORT)
    assert res.status_code == 200
    assert res.json()["diagnosis"] == "Contact dermatitis"

    updated = verified.put(url(appointment_id, "/report"), json={**REPORT, "advice": ""})
    assert updated.json()["advice"] is None

    seen = patient.get(url(appointment_id, "/report")).json()
    assert seen["prescription"] == REPORT["prescription"]
    assert seen["follow_up_date"] == "2030-01-15"


@pytest.mark.parametrize("bad", [{"diagnosis": ""}, {"follow_up_date": "not a date"}])
def test_report_fields_are_checked(session, verified, bad):
    appointment_id = appointment_now(session)
    verified.post(url(appointment_id, "/start"))
    assert verified.put(url(appointment_id, "/report"), json={**REPORT, **bad}).status_code == 422


def test_patient_cannot_write_the_report(session, verified, patient):
    appointment_id = appointment_now(session)
    verified.post(url(appointment_id, "/start"))
    assert patient.put(url(appointment_id, "/report"), json=REPORT).status_code == 403
