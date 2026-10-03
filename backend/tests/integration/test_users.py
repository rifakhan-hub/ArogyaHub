from tests.conftest import find_id

URL = "/api/v1/admin/users"


def test_health(client):
    assert client.get("/api/v1/health").json() == {"status": "ok", "db": "ok"}


def test_list_users(client):
    def names(**params):
        return [u["name"] for u in client.get(URL, params=params).json()["items"]]

    body = client.get(URL).json()
    assert body["total"] == 4
    assert body["page"] == 1 and body["page_size"] == 20
    assert body["items"][0]["created_at"].endswith("Z")  # dates are sent as UTC

    assert sorted(names(role="patient")) == ["Priya Sharma", "Rahul Verma"]
    assert names(q="mehta") == ["Dr. Anjali Mehta"]
    assert names(q="delhi") == ["Rahul Verma"]
    assert names(sort="name") == ["Admin", "Dr. Anjali Mehta", "Priya Sharma", "Rahul Verma"]
    assert len(names(page=2, page_size=3)) == 1


def test_bad_list_params(client):
    assert client.get(URL, params={"sort": "email"}).json()["error"]["code"] == "VALIDATION_ERROR"
    assert client.get(URL, params={"page_size": 500}).status_code == 422


def test_user_detail(client):
    user = client.get(f"{URL}/{find_id(client, 'priya@test.in')}").json()
    assert user["name"] == "Priya Sharma"
    assert user["phone"] == "+919800000001"
    assert user["stats"]["appointments"] == 0

    missing = client.get(f"{URL}/99999")
    assert missing.status_code == 404
    assert missing.json()["error"]["code"] == "NOT_FOUND"


def test_block_and_unblock(client):
    block_url = f"{URL}/{find_id(client, 'priya@test.in')}/block"

    short = client.patch(block_url, json={"blocked": True, "reason": "spam"})
    assert short.status_code == 422

    res = client.patch(block_url, json={"blocked": True, "reason": "Repeated no-shows"})
    assert res.json()["is_active"] is False
    assert res.json()["blocked_reason"] == "Repeated no-shows"

    blocked = client.get(URL, params={"status": "blocked"}).json()
    assert [u["name"] for u in blocked["items"]] == ["Priya Sharma"]

    res = client.patch(block_url, json={"blocked": False})
    assert res.json()["is_active"] is True
    assert res.json()["blocked_reason"] is None


def test_admins_cannot_be_blocked(client):
    block_url = f"{URL}/{find_id(client, 'admin@test.in')}/block"
    res = client.patch(block_url, json={"blocked": True, "reason": "Testing it"})
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "CANNOT_BLOCK_ADMIN"
