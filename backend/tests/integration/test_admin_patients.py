from tests.conftest import login

URL = "/api/v1/admin/patients"


def patient_id(admin, email):
    return admin.get(URL, params={"q": email}).json()["items"][0]["id"]


def test_health(client):
    assert client.get("/api/v1/health").json() == {"status": "ok", "db": "ok"}


def test_lists_only_patients(admin):
    body = admin.get(URL).json()
    assert body["total"] == 2
    assert {p["name"] for p in body["items"]} == {"Priya Sharma", "Rahul Verma"}
    assert body["items"][0]["created_at"].endswith("Z")


def test_search_and_page(admin):
    assert [p["name"] for p in admin.get(URL, params={"q": "priya"}).json()["items"]] == ["Priya Sharma"]
    assert len(admin.get(URL, params={"page": 2, "page_size": 1}).json()["items"]) == 1
    assert admin.get(URL, params={"page_size": 500}).status_code == 422


def test_patient_detail(admin):
    patient = admin.get(f"{URL}/{patient_id(admin, 'priya@test.in')}").json()
    assert patient["phone"] == "+919800000001"

    doctor = admin.get("/api/v1/admin/doctors", params={"q": "mehta"}).json()["items"][0]
    assert admin.get(f"{URL}/{doctor['user_id']}").status_code == 404


def test_block_and_unblock(admin, client):
    block_url = f"{URL}/{patient_id(admin, 'priya@test.in')}/block"
    assert admin.patch(block_url, json={"blocked": True, "reason": "spam"}).status_code == 422

    res = admin.patch(block_url, json={"blocked": True, "reason": "Repeated no-shows"})
    assert res.json()["is_active"] is False
    assert res.json()["blocked_reason"] == "Repeated no-shows"
    assert [p["name"] for p in admin.get(URL, params={"status": "blocked"}).json()["items"]] == ["Priya Sharma"]
    assert login(client, "priya@test.in").json()["error"]["code"] == "ACCOUNT_BLOCKED"

    res = admin.patch(block_url, json={"blocked": False})
    assert res.json()["is_active"] is True
    assert res.json()["blocked_reason"] is None


def test_only_admins_can_see_patients(doctor, patient, client):
    assert client.get(URL).status_code == 401
    assert doctor.get(URL).status_code == 403
    assert patient.get(URL).status_code == 403
