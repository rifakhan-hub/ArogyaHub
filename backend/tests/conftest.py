import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.deps import get_db
from app.core.security import hash_password
from app.db.base import Base
from app.main import app
from app.models import Admin, Doctor, Role, User, VerificationStatus

PASSWORD = "test-password-123"
PASSWORD_HASH = hash_password(PASSWORD)


def doctor_profile(licence: str, status: VerificationStatus) -> dict:
    return {
        "specialization": "Dermatology",
        "license_number": licence,
        "council": "Punjab Medical Council",
        "experience_years": 8,
        "consultation_fee": 500,
        "qualifications": "MBBS, MD",
        "verification_status": status,
    }


@pytest.fixture
def session():
    engine = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(engine)

    with TestSession() as db:
        admin = User(name="Admin", email="admin@test.in", role=Role.ADMIN, password_hash=PASSWORD_HASH)
        priya = User(
            name="Priya Sharma",
            email="priya@test.in",
            phone="+919800000001",
            role=Role.PATIENT,
            password_hash=PASSWORD_HASH,
        )
        rahul = User(name="Rahul Verma", email="rahul@test.in", city="Delhi", role=Role.PATIENT)
        mehta = User(name="Dr. Anjali Mehta", email="mehta@test.in", role=Role.DOCTOR, password_hash=PASSWORD_HASH)
        kapoor = User(name="Dr. Ravi Kapoor", email="kapoor@test.in", role=Role.DOCTOR, password_hash=PASSWORD_HASH)
        db.add_all([admin, priya, rahul, mehta, kapoor])
        db.flush()
        db.add_all(
            [
                Admin(user_id=admin.id),
                Doctor(user_id=mehta.id, **doctor_profile("PMC-1001", VerificationStatus.PENDING)),
                Doctor(user_id=kapoor.id, **doctor_profile("PMC-2002", VerificationStatus.VERIFIED)),
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


def logged_in(email: str) -> TestClient:
    client = TestClient(app)
    client.headers["Authorization"] = f"Bearer {login(client, email).json()['access_token']}"
    return client


@pytest.fixture
def admin(session):
    return logged_in("admin@test.in")


@pytest.fixture
def doctor(session):
    return logged_in("mehta@test.in")


@pytest.fixture
def patient(session):
    return logged_in("priya@test.in")


def login(client, email, password=PASSWORD):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})
