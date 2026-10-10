from sqlalchemy import select

from app.models import User
from tests.conftest import login

REGISTER = "/api/v1/auth/register"

NEW_USER = {
    "name": "Aman Gill",
    "email": "Aman.Gill@Example.com",
    "phone": "+919811112222",
    "city": "Patiala",
    "role": "patient",
    "password": "a-strong-password",
}


def test_register_creates_a_user(client):
    res = client.post(REGISTER, json=NEW_USER)
    assert res.status_code == 201
    user = res.json()
    assert user["name"] == "Aman Gill"
    assert user["email"] == "aman.gill@example.com"
    assert user["role"] == "patient"
    assert user["is_active"] is True
    assert "password" not in res.text


def test_registered_user_can_log_in(client):
    client.post(REGISTER, json=NEW_USER)
    res = login(client, "aman.gill@example.com", "a-strong-password")
    assert res.status_code == 200
    assert res.json()["user"]["name"] == "Aman Gill"


def test_password_is_stored_hashed(client, session):
    client.post(REGISTER, json=NEW_USER)
    with session() as db:
        stored = db.scalar(select(User.password_hash).where(User.email == "aman.gill@example.com"))
    assert stored.startswith("$argon2")


def test_register_always_creates_a_patient(client):
    res = client.post(REGISTER, json={**NEW_USER, "role": "admin"})
    assert res.status_code == 201
    assert res.json()["role"] == "patient"


def test_register_optional_fields(client):
    res = client.post(REGISTER, json={**NEW_USER, "phone": "", "city": None})
    assert res.status_code == 201
    assert res.json()["phone"] is None
    assert res.json()["city"] is None


def test_register_duplicate_email_and_phone(client):
    client.post(REGISTER, json=NEW_USER)

    same_email = client.post(REGISTER, json={**NEW_USER, "phone": None})
    assert same_email.status_code == 409
    assert same_email.json()["error"]["code"] == "EMAIL_TAKEN"

    same_phone = client.post(REGISTER, json={**NEW_USER, "email": "other@example.com"})
    assert same_phone.status_code == 409
    assert same_phone.json()["error"]["code"] == "PHONE_TAKEN"


def test_register_invalid_input(client):
    for bad in ({"email": "not-an-email"}, {"password": "short"}, {"name": "A"}, {"phone": "12ab"}):
        res = client.post(REGISTER, json={**NEW_USER, **bad})
        assert res.status_code == 422, bad
        assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_login(client):
    res = login(client, "ADMIN@test.in")
    assert res.status_code == 200
    body = res.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["role"] == "admin"
    assert body["user"]["last_login_at"] is not None
    assert "refresh_token" in client.cookies
    assert "httponly" in res.headers["set-cookie"].lower()


def test_login_wrong_password(client):
    res = login(client, "priya@test.in", "wrong-password")
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "INVALID_CREDENTIALS"
    assert login(client, "nobody@test.in").status_code == 401


def test_user_without_password_cannot_log_in(client):
    assert login(client, "rahul@test.in").status_code == 401


def test_me(client):
    assert client.get("/api/v1/users/me").status_code == 401

    token = login(client, "priya@test.in").json()["access_token"]
    me = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["email"] == "priya@test.in"


def test_refresh_uses_the_cookie(client):
    assert client.post("/api/v1/auth/refresh").json()["error"]["code"] == "NO_SESSION"

    login(client, "priya@test.in")
    res = client.post("/api/v1/auth/refresh")
    assert res.status_code == 200
    assert res.json()["user"]["email"] == "priya@test.in"


def test_access_token_cannot_refresh(client):
    token = login(client, "priya@test.in").json()["access_token"]
    client.cookies.clear()
    client.cookies.set("refresh_token", token)
    assert client.post("/api/v1/auth/refresh").status_code == 401


def test_logout(client):
    login(client, "priya@test.in")
    assert client.post("/api/v1/auth/logout").status_code == 204
    assert "refresh_token" not in client.cookies
    assert client.post("/api/v1/auth/refresh").status_code == 401
