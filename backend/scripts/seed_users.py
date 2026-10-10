from sqlalchemy import select

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import Admin, Doctor, Patient, Role, User, VerificationStatus

USERS = [
    ("Admin", "admin@aarogyahub.in", None, None, Role.ADMIN),
    ("Priya Sharma", "priya.sharma@example.com", "+919812345601", "Ludhiana", Role.PATIENT),
    ("Rahul Verma", "rahul.verma@example.com", "+919812345602", "Delhi", Role.PATIENT),
    ("Simran Kaur", "simran.kaur@example.com", None, "Amritsar", Role.PATIENT),
    ("Dr. Anjali Mehta", "anjali.mehta@example.com", None, "Chandigarh", Role.DOCTOR),
    ("Dr. Arjun Singh", "arjun.singh@example.com", None, "Ludhiana", Role.DOCTOR),
    ("Dr. Neha Gupta", "neha.gupta@example.com", None, "Delhi", Role.DOCTOR),
]

DOCTOR_PROFILES = {
    "anjali.mehta@example.com": (
        "Dermatology",
        "PMC-48213",
        "Punjab Medical Council",
        9,
        500,
        VerificationStatus.VERIFIED,
    ),
    "arjun.singh@example.com": (
        "General Physician",
        "PMC-51920",
        "Punjab Medical Council",
        6,
        400,
        VerificationStatus.VERIFIED,
    ),
    "neha.gupta@example.com": (
        "Paediatrics",
        "DMC-77310",
        "Delhi Medical Council",
        11,
        600,
        VerificationStatus.PENDING,
    ),
}


def main() -> None:
    Base.metadata.create_all(engine)

    added = 0
    with SessionLocal() as db:
        for name, email, phone, city, role in USERS:
            user = db.scalar(select(User).where(User.email == email))
            if not user:
                user = User(name=name, email=email, phone=phone, city=city, role=role, is_email_verified=True)
                db.add(user)
                added += 1
            db.flush()

            if role == Role.ADMIN and not db.scalar(select(Admin).where(Admin.user_id == user.id)):
                db.add(Admin(user_id=user.id))

            if email in DOCTOR_PROFILES and not db.scalar(select(Doctor).where(Doctor.user_id == user.id)):
                speciality, licence, council, years, fee, status = DOCTOR_PROFILES[email]
                db.add(
                    Doctor(
                        user_id=user.id,
                        specialization=speciality,
                        license_number=licence,
                        council=council,
                        experience_years=years,
                        consultation_fee=fee,
                        qualifications="MBBS, MD",
                        verification_status=status,
                    )
                )

        patients_without_profile = db.scalars(
            select(User).where(User.role == Role.PATIENT, ~User.id.in_(select(Patient.user_id)))
        ).all()
        for user in patients_without_profile:
            db.add(Patient(user_id=user.id))
        db.commit()

    print(f"Done. Added {added} user(s), and any missing admin, doctor and patient profiles.")


if __name__ == "__main__":
    main()
