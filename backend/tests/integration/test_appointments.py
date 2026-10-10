from tests.conftest import book_first_slot, kapoor_id, logged_in, tomorrow_ist

URL = "/api/v1/appointments"


def test_book_an_appointment(patient, verified):
    res = book_first_slot(patient, verified)
    assert res.status_code == 201
    appointment = res.json()
    assert appointment["status"] == "scheduled"
    assert appointment["doctor_name"] == "Dr. Ravi Kapoor"
    assert appointment["patient_name"] == "Priya Sharma"
    assert appointment["fee"] == 500
    assert appointment["reason"] == "Skin rash"


def test_the_same_slot_cannot_be_booked_twice(patient, verified, session):
    first = book_first_slot(patient, verified).json()
    other = logged_in("priya@test.in")
    res = other.post(URL, json={"doctor_id": int(kapoor_id(other)), "start_time": first["start_time"]})
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "SLOT_NOT_AVAILABLE"


def test_only_offered_slots_can_be_booked(patient, verified):
    day = tomorrow_ist()
    book_first_slot(patient, verified)
    res = patient.post(URL, json={"doctor_id": int(kapoor_id(patient)), "start_time": f"{day}T23:00:00+05:30"})
    assert res.json()["error"]["code"] == "SLOT_NOT_AVAILABLE"


def test_patient_and_doctor_both_see_the_appointment(patient, verified):
    book_first_slot(patient, verified)
    assert len(patient.get(f"{URL}/me").json()) == 1
    assert len(verified.get(f"{URL}/me").json()) == 1
    assert len(patient.get(f"{URL}/me", params={"upcoming": "true"}).json()) == 1
    assert patient.get(f"{URL}/me", params={"upcoming": "false"}).json() == []


def test_cancel_frees_the_slot(patient, verified):
    appointment = book_first_slot(patient, verified).json()
    res = patient.post(f"{URL}/{appointment['id']}/cancel", json={"reason": "Feeling better"})
    assert res.json()["status"] == "cancelled"
    assert res.json()["cancel_reason"] == "Feeling better"

    again = patient.post(
        URL, json={"doctor_id": int(appointment["doctor_id"]), "start_time": appointment["start_time"]}
    )
    assert again.status_code == 201

    assert patient.post(f"{URL}/{appointment['id']}/cancel", json={}).json()["error"]["code"] == "CANNOT_CANCEL"


def test_doctor_can_cancel_too(patient, verified):
    appointment = book_first_slot(patient, verified).json()
    assert verified.post(f"{URL}/{appointment['id']}/cancel", json={}).json()["status"] == "cancelled"


def test_others_cannot_see_or_change_it(patient, verified, doctor, admin):
    appointment = book_first_slot(patient, verified).json()
    assert doctor.get(f"{URL}/{appointment['id']}").status_code == 404
    assert doctor.post(f"{URL}/{appointment['id']}/cancel", json={}).status_code == 404
    assert admin.get(f"{URL}/me").status_code == 403


def test_no_show_only_after_the_start(patient, verified):
    appointment = book_first_slot(patient, verified).json()
    res = verified.post(f"{URL}/{appointment['id']}/no-show")
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "CANNOT_MARK_NO_SHOW"


def test_only_patients_book(verified):
    res = verified.post(URL, json={"doctor_id": 1, "start_time": "2030-01-01T09:00:00Z"})
    assert res.status_code == 403
