URL = "/api/v1/admin/doctors"


def doctor_id(admin, email):
    return admin.get(URL, params={"q": email}).json()["items"][0]["id"]


def test_list_and_filter_doctors(admin):
    everyone = admin.get(URL).json()
    assert everyone["total"] == 2

    pending = admin.get(URL, params={"status": "pending"}).json()
    assert [d["name"] for d in pending["items"]] == ["Dr. Anjali Mehta"]

    verified = admin.get(URL, params={"status": "verified"}).json()
    assert [d["name"] for d in verified["items"]] == ["Dr. Ravi Kapoor"]

    by_licence = admin.get(URL, params={"q": "PMC-2002"}).json()
    assert by_licence["total"] == 1


def test_doctor_detail(admin):
    doctor = admin.get(f"{URL}/{doctor_id(admin, 'mehta@test.in')}").json()
    assert doctor["license_number"] == "PMC-1001"
    assert doctor["council"] == "Punjab Medical Council"
    assert admin.get(f"{URL}/9999").status_code == 404


def test_approve_a_doctor(admin):
    res = admin.post(f"{URL}/{doctor_id(admin, 'mehta@test.in')}/verify", json={"action": "approve"})
    assert res.status_code == 200
    assert res.json()["verification_status"] == "verified"
    assert res.json()["reviewed_at"] is not None


def test_reject_needs_a_reason(admin):
    verify = f"{URL}/{doctor_id(admin, 'mehta@test.in')}/verify"
    assert admin.post(verify, json={"action": "reject"}).status_code == 422
    assert admin.post(verify, json={"action": "reject", "reason": "too short"}).status_code == 422

    res = admin.post(verify, json={"action": "reject", "reason": "Licence photo is blurry"})
    assert res.json()["verification_status"] == "rejected"
    assert res.json()["rejection_reason"] == "Licence photo is blurry"


def test_a_profile_is_reviewed_only_once(admin):
    verify = f"{URL}/{doctor_id(admin, 'kapoor@test.in')}/verify"
    res = admin.post(verify, json={"action": "approve"})
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "ALREADY_REVIEWED"


def test_only_admins_can_review_doctors(doctor, patient, client):
    assert client.get(URL).status_code == 401
    assert doctor.get(URL).status_code == 403
    assert patient.get(URL).status_code == 403
