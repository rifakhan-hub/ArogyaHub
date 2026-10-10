from tests.conftest import book_first_slot, kapoor_id, open_morning_hours, tomorrow_ist

URL = "/api/v1/doctors/me/availability"


def test_add_list_and_remove_hours(verified):
    res = open_morning_hours(verified, tomorrow_ist())
    assert res.status_code == 201
    assert res.json()["slot_minutes"] == 30

    hours = verified.get(URL).json()
    assert len(hours) == 1
    assert hours[0]["start_time"] == "09:00:00"

    assert verified.delete(f"{URL}/{hours[0]['id']}").status_code == 204
    assert verified.get(URL).json() == []


def test_overlapping_hours_are_rejected(verified):
    day = tomorrow_ist()
    open_morning_hours(verified, day)
    body = {"day_of_week": day.weekday(), "start_time": "11:00", "end_time": "13:00", "slot_minutes": 15}
    res = verified.post(URL, json=body)
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "HOURS_OVERLAP"


def test_hours_are_checked(verified):
    for bad in (
        {"day_of_week": 7, "start_time": "09:00", "end_time": "12:00", "slot_minutes": 30},
        {"day_of_week": 1, "start_time": "12:00", "end_time": "09:00", "slot_minutes": 30},
        {"day_of_week": 1, "start_time": "09:00", "end_time": "12:00", "slot_minutes": 7},
    ):
        assert verified.post(URL, json=bad).status_code == 422, bad


def test_only_approved_doctors_set_hours(doctor, patient):
    res = doctor.get(URL)
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "DOCTOR_NOT_VERIFIED"
    assert patient.get(URL).status_code == 403


def test_public_doctor_list_shows_only_approved_doctors(client):
    doctors = client.get("/api/v1/doctors").json()
    assert [d["name"] for d in doctors["items"]] == ["Dr. Ravi Kapoor"]
    assert client.get("/api/v1/doctors", params={"specialization": "Cardiology"}).json()["total"] == 0


def test_free_slots_for_a_day(client, verified):
    day = tomorrow_ist()
    open_morning_hours(verified, day)
    slots = client.get(f"/api/v1/doctors/{kapoor_id(client)}/slots", params={"date": day.isoformat()}).json()
    assert len(slots) == 6
    assert slots[0]["start"].endswith("Z")


def test_booked_slots_are_not_offered(patient, verified):
    book_first_slot(patient, verified)
    day = tomorrow_ist().isoformat()
    slots = patient.get(f"/api/v1/doctors/{kapoor_id(patient)}/slots", params={"date": day}).json()
    assert len(slots) == 5
