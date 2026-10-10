from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_admin
from app.core.errors import AppError
from app.core.storage import send_file
from app.db.pagination import paginate
from app.models import Doctor, DoctorDocument, User, VerificationStatus
from app.models.user import utcnow
from app.schemas.common import Page
from app.schemas.doctor import DoctorOut, VerifyRequest
from app.schemas.document import DocumentOut

router = APIRouter(prefix="/admin/doctors", tags=["admin: doctors"], dependencies=[Depends(require_admin)])


@router.get("", response_model=Page[DoctorOut])
def list_doctors(
    status: VerificationStatus | None = None,
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = select(Doctor).join(Doctor.user)
    if status:
        query = query.where(Doctor.verification_status == status)
    if q:
        q = q.strip()
        query = query.where(
            or_(
                User.name.icontains(q),
                User.email.icontains(q),
                Doctor.specialization.icontains(q),
                Doctor.license_number.icontains(q),
            )
        )
    newest_first = status != VerificationStatus.PENDING
    query = query.order_by(Doctor.submitted_at.desc() if newest_first else Doctor.submitted_at.asc(), Doctor.id)

    doctors, total = paginate(db, query, page, page_size)
    return Page(items=[DoctorOut.from_doctor(d) for d in doctors], total=total, page=page, page_size=page_size)


@router.get("/{doctor_id}", response_model=DoctorOut)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    return DoctorOut.from_doctor(find_doctor(db, doctor_id))


@router.post("/{doctor_id}/verify", response_model=DoctorOut)
def verify_doctor(
    doctor_id: int,
    body: VerifyRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    doctor = find_doctor(db, doctor_id)
    if doctor.verification_status != VerificationStatus.PENDING:
        raise AppError(409, "ALREADY_REVIEWED", "This profile has already been reviewed.")

    reason = (body.reason or "").strip()
    if body.action == "reject" and len(reason) < 10:
        raise AppError(422, "VALIDATION_ERROR", "Give a reason of at least 10 characters.")

    approved = body.action == "approve"
    doctor.verification_status = VerificationStatus.VERIFIED if approved else VerificationStatus.REJECTED
    doctor.rejection_reason = None if approved else reason
    doctor.reviewed_at = utcnow()
    doctor.reviewed_by = admin.id
    db.commit()
    return DoctorOut.from_doctor(doctor)


@router.get("/{doctor_id}/documents", response_model=list[DocumentOut])
def list_documents(doctor_id: int, db: Session = Depends(get_db)):
    doctor = find_doctor(db, doctor_id)
    documents = db.scalars(
        select(DoctorDocument).where(DoctorDocument.doctor_id == doctor.id).order_by(DoctorDocument.uploaded_at)
    ).all()
    return [DocumentOut.build(d) for d in documents]


@router.get("/{doctor_id}/documents/{document_id}/file")
def open_document(doctor_id: int, document_id: int, db: Session = Depends(get_db)):
    document = db.get(DoctorDocument, document_id)
    if not document or document.doctor_id != doctor_id:
        raise AppError(404, "NOT_FOUND", "We could not find that document.")
    return send_file(document.storage_path, document.file_name, document.content_type)


def find_doctor(db: Session, doctor_id: int) -> Doctor:
    doctor = db.get(Doctor, doctor_id)
    if not doctor:
        raise AppError(404, "NOT_FOUND", "We could not find that doctor.")
    return doctor
