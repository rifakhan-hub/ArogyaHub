"""Each test gets a fresh in-memory SQLite database, so no MySQL server is needed."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.deps import get_db
from app.db.base import Base
from app.main import app
from app.models import Role, User


@pytest.fixture
def client():
    # one shared in-memory database; FastAPI runs routes in worker threads
    engine = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(engine)

    with TestSession() as db:
        db.add_all(
            [
                User(name="Admin", email="admin@test.in", role=Role.ADMIN),
                User(name="Priya Sharma", email="priya@test.in", phone="+919800000001", role=Role.PATIENT),
                User(name="Rahul Verma", email="rahul@test.in", city="Delhi", role=Role.PATIENT),
                User(name="Dr. Anjali Mehta", email="mehta@test.in", role=Role.DOCTOR),
            ]
        )
        db.commit()

    def test_db():
        with TestSession() as db:
            yield db

    app.dependency_overrides[get_db] = test_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def find_id(client, email):
    """The id of the user with this email, looked up through the API."""
    return client.get("/api/v1/admin/users", params={"q": email}).json()["items"][0]["id"]
