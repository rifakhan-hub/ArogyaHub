import sys
from getpass import getpass

from sqlalchemy import select

from app.core.security import WEAK_PASSWORD, hash_password, is_strong_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import Admin, Role, User


def main() -> None:
    email = input("Admin email: ").strip().lower()
    password = getpass("Password (8+ characters, with 3 of lowercase, uppercase, numbers and symbols): ")
    if not is_strong_password(password):
        sys.exit(WEAK_PASSWORD)
    if getpass("Type the password again: ") != password:
        sys.exit("The passwords don't match.")

    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user:
            user.role = Role.ADMIN
            user.is_active = True
            user.password_hash = hash_password(password)
            print(f"Updated {email}: it is an admin and has the new password.")
        else:
            db.add(
                User(
                    name="Admin",
                    email=email,
                    role=Role.ADMIN,
                    is_email_verified=True,
                    password_hash=hash_password(password),
                )
            )
            print(f"Created the admin {email}.")
        db.flush()
        user = db.scalar(select(User).where(User.email == email))
        if not db.scalar(select(Admin).where(Admin.user_id == user.id)):
            db.add(Admin(user_id=user.id))
        db.commit()


if __name__ == "__main__":
    main()
