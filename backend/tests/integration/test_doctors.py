from app.core.security import hash_password
from app.models import Role, User
from tests.conftest import PASSWORD, logged_in, login

REGISTER = "/api/v1/auth/register/doctor"

NEW_DOCTOR = {
    "name": "Dr. Kavya Rao",
    "email": "Kavya.Rao@Example.com",
    "phone": "+919811113333",
    "city": "Mohali",
    "password": "a-strong-password",
    "specialization": "Paediatrics",
    "license_number": "PMC-9090",
    "council": "Punjab Medical Council",
    "experience_years": 7,
    "consultation_fee": 550,
    "qualifications": "MBBS, DCH",
    "bio": "Child health and vaccinations.",
}

PROFILE = {
    key: NEW_DOCTOR[key]
    for key in (
        "specialization",
        "license_number",
        "council",
        "experience_years",
        "consultation_fee",
        "qualifications",
        "bio",
    )
}


def test_register_doctor_creates_a_pending_profile(client):
    res = client.post(REGISTER, json=NEW_DOCTOR)
    assert res.status_code == 201
    doctor = res.json()
    assert doctor["email"] == "kavya.rao@example.com"
    assert doctor["specialization"] == "Paediatrics"
    assert doctor["verification_status"] == "pending"
    assert "password" not in res.text


def test_pending_doctor_can_log_in_and_see_their_status(client):
    client.post(REGISTER, json=NEW_DOCTOR)
    token = login(client, "kavya.rao@example.com", "a-strong-password").json()["access_token"]
    me = client.get("/api/v1/doctors/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["verification_status"] == "pending"
    assert me.json()["license_number"] == "PMC-9090"


def test_register_doctor_rejects_a_used_licence_or_email(client):
    used_licence = client.post(REGISTER, json={**NEW_DOCTOR, "license_number": "PMC-1001"})
    assert used_licence.json()["error"]["code"] == "LICENSE_TAKEN"

    used_email = client.post(REGISTER, json={**NEW_DOCTOR, "email": "mehta@test.in"})
    assert used_email.json()["error"]["code"] == "EMAIL_TAKEN"


def test_register_doctor_checks_each_field(client):
    for bad in (
        {"specialization": ""},
        {"license_number": "1"},
        {"experience_years": -1},
        {"consultation_fee": "free"},
        {"qualifications": ""},
        {"password": "short"},
    ):
        res = client.post(REGISTER, json={**NEW_DOCTOR, **bad})
        assert res.status_code == 422, bad


def test_only_doctors_have_a_doctor_profile(patient, client):
    assert patient.get("/api/v1/doctors/me").status_code == 403
    assert client.get("/api/v1/doctors/me").status_code == 401


def test_rejected_doctor_updates_and_goes_back_for_review(doctor, admin):
    doctor_id = doctor.get("/api/v1/doctors/me").json()["id"]
    admin.post(
        f"/api/v1/admin/doctors/{doctor_id}/verify", json={"action": "reject", "reason": "Licence number unreadable"}
    )

    me = doctor.get("/api/v1/doctors/me").json()
    assert me["verification_status"] == "rejected"
    assert me["rejection_reason"] == "Licence number unreadable"

    res = doctor.put("/api/v1/doctors/me", json={**PROFILE, "license_number": "PMC-1001-B"})
    assert res.status_code == 200
    assert res.json()["verification_status"] == "pending"
    assert res.json()["rejection_reason"] is None


def test_profile_update_cannot_take_another_licence(doctor):
    res = doctor.put("/api/v1/doctors/me", json={**PROFILE, "license_number": "PMC-2002"})
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "LICENSE_TAKEN"


def add_doctor_without_profile(session):
    with session() as db:
        db.add(
            User(name="Dr. Old Account", email="old@test.in", role=Role.DOCTOR, password_hash=hash_password(PASSWORD))
        )
        db.commit()
    return logged_in("old@test.in")


def test_doctor_without_a_profile_can_finish_it(session):
    doctor = add_doctor_without_profile(session)

    missing = doctor.get("/api/v1/doctors/me")
    assert missing.status_code == 404
    assert missing.json()["error"]["code"] == "NO_DOCTOR_PROFILE"

    res = doctor.put("/api/v1/doctors/me", json={**PROFILE, "license_number": "PMC-7777"})
    assert res.status_code == 200
    assert res.json()["verification_status"] == "pending"
    assert doctor.get("/api/v1/doctors/me").json()["license_number"] == "PMC-7777"


def test_finishing_a_profile_cannot_take_another_licence(session):
    res = add_doctor_without_profile(session).put("/api/v1/doctors/me", json={**PROFILE, "license_number": "PMC-2002"})
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "LICENSE_TAKEN"
