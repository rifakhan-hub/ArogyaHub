from tests.conftest import find_id, login

URL = "/api/v1/admin/users"


def test_health(client):
    assert client.get("/api/v1/health").json() == {"status": "ok", "db": "ok"}


def test_list_users(admin):
    def names(**params):
        return [u["name"] for u in admin.get(URL, params=params).json()["items"]]

    body = admin.get(URL).json()
    assert body["total"] == 4
    assert body["page"] == 1 and body["page_size"] == 20
    assert body["items"][0]["created_at"].endswith("Z")

    assert sorted(names(role="patient")) == ["Priya Sharma", "Rahul Verma"]
    assert names(q="mehta") == ["Dr. Anjali Mehta"]
    assert names(q="delhi") == ["Rahul Verma"]
    assert names(sort="name") == ["Admin", "Dr. Anjali Mehta", "Priya Sharma", "Rahul Verma"]
    assert len(names(page=2, page_size=3)) == 1


def test_bad_list_params(admin):
    assert admin.get(URL, params={"sort": "email"}).json()["error"]["code"] == "VALIDATION_ERROR"
    assert admin.get(URL, params={"page_size": 500}).status_code == 422


def test_user_detail(admin):
    user = admin.get(f"{URL}/{find_id(admin, 'priya@test.in')}").json()
    assert user["name"] == "Priya Sharma"
    assert user["phone"] == "+919800000001"
    assert user["stats"]["appointments"] == 0

    missing = admin.get(f"{URL}/99999")
    assert missing.status_code == 404
    assert missing.json()["error"]["code"] == "NOT_FOUND"


def test_block_and_unblock(admin):
    block_url = f"{URL}/{find_id(admin, 'priya@test.in')}/block"

    short = admin.patch(block_url, json={"blocked": True, "reason": "spam"})
    assert short.status_code == 422

    res = admin.patch(block_url, json={"blocked": True, "reason": "Repeated no-shows"})
    assert res.json()["is_active"] is False
    assert res.json()["blocked_reason"] == "Repeated no-shows"

    blocked = admin.get(URL, params={"status": "blocked"}).json()
    assert [u["name"] for u in blocked["items"]] == ["Priya Sharma"]

    res = admin.patch(block_url, json={"blocked": False})
    assert res.json()["is_active"] is True
    assert res.json()["blocked_reason"] is None


def test_admins_cannot_be_blocked(admin):
    block_url = f"{URL}/{find_id(admin, 'admin@test.in')}/block"
    res = admin.patch(block_url, json={"blocked": True, "reason": "Testing it"})
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "CANNOT_BLOCK_ADMIN"


def test_admin_routes_need_a_login(client):
    assert client.get(URL).status_code == 401


def test_admin_routes_are_only_for_admins(client):
    token = login(client, "priya@test.in").json()["access_token"]
    res = client.get(URL, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"


def test_blocked_user_cannot_log_in(admin, client):
    admin.patch(f"{URL}/{find_id(admin, 'priya@test.in')}/block", json={"blocked": True, "reason": "Repeated no-shows"})
    res = login(client, "priya@test.in")
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "ACCOUNT_BLOCKED"
