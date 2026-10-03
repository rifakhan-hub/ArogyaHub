"""Creates the tables and some sample users. Run from the backend folder:

    .venv/Scripts/python -m scripts.seed_users

Running it again skips users that already exist.
"""

from sqlalchemy import select

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import Role, User

USERS = [
    ("Admin", "admin@aarogyahub.in", None, None, Role.ADMIN),
    ("Priya Sharma", "priya.sharma@example.com", "+919812345601", "Ludhiana", Role.PATIENT),
    ("Rahul Verma", "rahul.verma@example.com", "+919812345602", "Delhi", Role.PATIENT),
    ("Simran Kaur", "simran.kaur@example.com", None, "Amritsar", Role.PATIENT),
    ("Dr. Anjali Mehta", "anjali.mehta@example.com", None, "Chandigarh", Role.DOCTOR),
    ("Dr. Arjun Singh", "arjun.singh@example.com", None, "Ludhiana", Role.DOCTOR),
    ("Dr. Neha Gupta", "neha.gupta@example.com", None, "Delhi", Role.DOCTOR),
]


def main() -> None:
    Base.metadata.create_all(engine)  # creates any missing tables

    added = 0
    with SessionLocal() as db:
        for name, email, phone, city, role in USERS:
            if db.scalar(select(User).where(User.email == email)):
                continue
            db.add(User(name=name, email=email, phone=phone, city=city, role=role, is_email_verified=True))
            added += 1
        db.commit()

    print(f"Done. Added {added} user(s).")


if __name__ == "__main__":
    main()
