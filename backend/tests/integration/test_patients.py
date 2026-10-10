from sqlalchemy import select

from app.models import Patient, User

URL = "/api/v1/patients/me"

UPDATE = {
    "name": "Priya S. Sharma",
    "phone": "+919800000009",
    "city": "Ludhiana",
    "date_of_birth": "1994-05-17",
    "gender": "female",
    "blood_group": "B+",
    "allergies": "Penicillin",
}


def test_register_creates_a_patient_profile(client, session):
    client.post(
        "/api/v1/auth/register",
        json={"name": "Aman Gill", "email": "aman@example.com", "password": "a-strong-password"},
    )
    with session() as db:
        user = db.scalar(select(User).where(User.email == "aman@example.com"))
        assert db.scalar(select(Patient).where(Patient.user_id == user.id)) is not None


def test_get_my_profile_starts_empty(patient):
    res = patient.get(URL)
    assert res.status_code == 200
    me = res.json()
    assert me["email"] == "priya@test.in"
    assert me["blood_group"] is None
    assert me["date_of_birth"] is None


def test_update_my_profile(patient):
    res = patient.put(URL, json=UPDATE)
    assert res.status_code == 200
    me = res.json()
    assert me["name"] == "Priya S. Sharma"
    assert me["blood_group"] == "B+"
    assert me["date_of_birth"] == "1994-05-17"
    assert patient.get(URL).json()["allergies"] == "Penicillin"


def test_blank_fields_are_cleared(patient):
    patient.put(URL, json=UPDATE)
    res = patient.put(URL, json={**UPDATE, "allergies": "", "blood_group": "", "date_of_birth": ""})
    assert res.json()["allergies"] is None
    assert res.json()["blood_group"] is None
    assert res.json()["date_of_birth"] is None


def test_update_checks_fields(patient):
    for bad in (
        {"blood_group": "C+"},
        {"gender": "unknown"},
        {"date_of_birth": "2999-01-01"},
        {"name": "A"},
        {"phone": "12ab"},
    ):
        assert patient.put(URL, json={**UPDATE, **bad}).status_code == 422, bad


def test_phone_must_be_unique(patient, session):
    with session() as db:
        db.scalar(select(User).where(User.email == "rahul@test.in")).phone = "+919800000077"
        db.commit()
    res = patient.put(URL, json={**UPDATE, "phone": "+919800000077"})
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "PHONE_TAKEN"


def test_only_patients_have_a_patient_profile(doctor, admin, client):
    assert doctor.get(URL).status_code == 403
    assert admin.get(URL).status_code == 403
    assert client.get(URL).status_code == 401


def test_admin_sees_the_health_details(patient, admin):
    patient.put(URL, json=UPDATE)
    patient_id = admin.get("/api/v1/admin/patients", params={"q": "priya"}).json()["items"][0]["id"]
    detail = admin.get(f"/api/v1/admin/patients/{patient_id}").json()
    assert detail["blood_group"] == "B+"
    assert detail["allergies"] == "Penicillin"
