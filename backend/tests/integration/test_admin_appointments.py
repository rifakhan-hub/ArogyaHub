from tests.conftest import book_first_slot, tomorrow_ist
from tests.integration.test_consultations import REPORT, appointment_now, url

URL = "/api/v1/admin/appointments"


def test_admin_sees_every_appointment(admin, patient, verified):
    booked = book_first_slot(patient, verified).json()

    page = admin.get(URL).json()
    assert page["total"] == 1
    assert page["items"][0]["id"] == booked["id"]
    assert (page["items"][0]["patient_name"], page["items"][0]["doctor_name"]) == ("Priya Sharma", "Dr. Ravi Kapoor")


def test_filters_by_search_status_and_day(admin, patient, verified):
    book_first_slot(patient, verified)

    assert admin.get(URL, params={"q": "kapoor"}).json()["total"] == 1
    assert admin.get(URL, params={"q": "priya"}).json()["total"] == 1
    assert admin.get(URL, params={"q": "nobody"}).json()["total"] == 0
    assert admin.get(URL, params={"status": "scheduled"}).json()["total"] == 1
    assert admin.get(URL, params={"status": "completed"}).json()["total"] == 0
    assert admin.get(URL, params={"date": tomorrow_ist().isoformat()}).json()["total"] == 1
    assert admin.get(URL, params={"date": "2020-01-01"}).json()["total"] == 0


def test_summary_counts_each_status(admin, patient, verified):
    booked = book_first_slot(patient, verified).json()
    patient.post(f"/api/v1/appointments/{booked['id']}/cancel", json={"reason": "Feeling better"})

    summary = admin.get(f"{URL}/summary").json()
    assert summary == {
        "scheduled": 0,
        "in_progress": 0,
        "completed": 0,
        "cancelled": 1,
        "no_show": 0,
        "total": 1,
    }


def test_details_include_the_consultation_and_report(session, admin, verified):
    appointment_id = appointment_now(session)
    detail = admin.get(f"{URL}/{appointment_id}").json()
    assert detail["consultation"] is None
    assert detail["report"] is None

    verified.post(url(appointment_id, "/start"))
    verified.put(url(appointment_id, "/report"), json=REPORT)
    verified.post(url(appointment_id, "/end"))

    detail = admin.get(f"{URL}/{appointment_id}").json()
    assert detail["appointment"]["status"] == "completed"
    assert detail["consultation"]["ended_at"] is not None
    assert detail["report"]["diagnosis"] == "Contact dermatitis"
    assert [m["name"] for m in detail["report"]["medicines"]] == ["Cetirizine", "Calamine lotion"]


def test_only_admins_can_see_appointments(patient, verified):
    assert patient.get(URL).status_code == 403
    assert verified.get(f"{URL}/summary").status_code == 403


def test_unknown_appointment(admin):
    assert admin.get(f"{URL}/999").json()["error"]["code"] == "NOT_FOUND"
