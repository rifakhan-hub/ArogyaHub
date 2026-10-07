import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.deps import get_db
from app.core.security import hash_password
from app.db.base import Base
from app.main import app
from app.models import Role, User

PASSWORD = "test-password-123"
PASSWORD_HASH = hash_password(PASSWORD)


@pytest.fixture
def session():
    engine = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(engine)

    with TestSession() as db:
        db.add_all(
            [
                User(name="Admin", email="admin@test.in", role=Role.ADMIN, password_hash=PASSWORD_HASH),
                User(
                    name="Priya Sharma",
                    email="priya@test.in",
                    phone="+919800000001",
                    role=Role.PATIENT,
                    password_hash=PASSWORD_HASH,
                ),
                User(name="Rahul Verma", email="rahul@test.in", city="Delhi", role=Role.PATIENT),
                User(name="Dr. Anjali Mehta", email="mehta@test.in", role=Role.DOCTOR, password_hash=PASSWORD_HASH),
            ]
        )
        db.commit()

    def test_db():
        with TestSession() as db:
            yield db

    app.dependency_overrides[get_db] = test_db
    yield TestSession
    app.dependency_overrides.clear()


@pytest.fixture
def client(session):
    return TestClient(app)


@pytest.fixture
def admin(session):
    client = TestClient(app)
    client.headers["Authorization"] = f"Bearer {login(client, 'admin@test.in').json()['access_token']}"
    return client


def login(client, email, password=PASSWORD):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def find_id(client, email):
    return client.get("/api/v1/admin/users", params={"q": email}).json()["items"][0]["id"]
