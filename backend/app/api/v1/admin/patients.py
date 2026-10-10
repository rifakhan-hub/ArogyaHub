from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_admin
from app.core.errors import AppError
from app.db.pagination import paginate
from app.models import Patient, Role, User
from app.schemas.common import Page
from app.schemas.patient import PatientOut
from app.schemas.user import BlockUserRequest, UserOut

router = APIRouter(prefix="/admin/patients", tags=["admin: patients"], dependencies=[Depends(require_admin)])


@router.get("", response_model=Page[UserOut])
def list_patients(
    q: str | None = None,
    status: Literal["active", "blocked"] | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = select(User).where(User.role == Role.PATIENT)
    if q:
        q = q.strip()
        query = query.where(or_(User.name.icontains(q), User.email.icontains(q), User.phone.icontains(q)))
    if status:
        query = query.where(User.is_active == (status == "active"))
    query = query.order_by(User.created_at.desc(), User.id.desc())

    patients, total = paginate(db, query, page, page_size)
    return Page(items=[UserOut.model_validate(p) for p in patients], total=total, page=page, page_size=page_size)


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    user = find_patient(db, patient_id)
    profile = db.scalar(select(Patient).where(Patient.user_id == user.id))
    return PatientOut.build(user, profile)


@router.patch("/{patient_id}/block", response_model=UserOut)
def block_patient(patient_id: int, body: BlockUserRequest, db: Session = Depends(get_db)):
    patient = find_patient(db, patient_id)
    reason = (body.reason or "").strip()
    if body.blocked and len(reason) < 10:
        raise AppError(422, "VALIDATION_ERROR", "Give a reason of at least 10 characters.")

    patient.is_active = not body.blocked
    patient.blocked_reason = reason if body.blocked else None
    db.commit()
    return UserOut.model_validate(patient)


def find_patient(db: Session, patient_id: int) -> User:
    patient = db.get(User, patient_id)
    if not patient or patient.role != Role.PATIENT:
        raise AppError(404, "NOT_FOUND", "We could not find that patient.")
    return patient
