from sqlalchemy import select

from app.models import User

URL = "/api/v1/users"

NEW_USER = {
    "name": "Aman Gill",
    "email": "Aman.Gill@Example.com",
    "phone": "+919811112222",
    "city": "Patiala",
    "role": "patient",
    "password": "a-strong-password",
}


def test_register_creates_a_user(client):
    res = client.post(URL, json=NEW_USER)
    assert res.status_code == 201
    user = res.json()
    assert user["name"] == "Aman Gill"
    assert user["email"] == "aman.gill@example.com"
    assert user["role"] == "patient"
    assert user["is_active"] is True
    assert "password" not in res.text

    listed = client.get("/api/v1/admin/users", params={"q": "aman"}).json()
    assert [u["email"] for u in listed["items"]] == ["aman.gill@example.com"]


def test_password_is_stored_hashed(client, session):
    client.post(URL, json=NEW_USER)
    with session() as db:
        stored = db.scalar(select(User.password_hash).where(User.email == "aman.gill@example.com"))
    assert stored and stored != NEW_USER["password"]
    assert stored.startswith("$argon2")


def test_optional_fields_can_be_left_out(client):
    res = client.post(URL, json={**NEW_USER, "phone": "", "city": None})
    assert res.status_code == 201
    assert res.json()["phone"] is None
    assert res.json()["city"] is None


def test_duplicate_email_and_phone(client):
    client.post(URL, json=NEW_USER)

    same_email = client.post(URL, json={**NEW_USER, "phone": None, "email": "aman.gill@example.com"})
    assert same_email.status_code == 409
    assert same_email.json()["error"]["code"] == "EMAIL_TAKEN"

    same_phone = client.post(URL, json={**NEW_USER, "email": "other@example.com"})
    assert same_phone.status_code == 409
    assert same_phone.json()["error"]["code"] == "PHONE_TAKEN"


def test_invalid_input(client):
    for bad in (
        {"email": "not-an-email"},
        {"password": "short"},
        {"role": "admin"},
        {"name": "A"},
        {"phone": "12ab"},
    ):
        res = client.post(URL, json={**NEW_USER, **bad})
        assert res.status_code == 422, bad
        assert res.json()["error"]["code"] == "VALIDATION_ERROR"
