from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import current_doctor, get_db
from app.core.errors import AppError
from app.core.storage import delete_file, save_upload, send_file
from app.models import Doctor, DoctorDocument, DocumentType, VerificationStatus
from app.schemas.document import DocumentOut

router = APIRouter(prefix="/doctors/me/documents", tags=["doctor documents"])

ALLOWED = {".pdf", ".jpg", ".jpeg", ".png"}


@router.get("", response_model=list[DocumentOut])
def list_my_documents(doctor: Doctor = Depends(current_doctor), db: Session = Depends(get_db)):
    documents = db.scalars(
        select(DoctorDocument).where(DoctorDocument.doctor_id == doctor.id).order_by(DoctorDocument.uploaded_at)
    ).all()
    return [DocumentOut.build(d) for d in documents]


@router.post("", response_model=DocumentOut, status_code=201)
def upload_document(
    doc_type: DocumentType = Form(),
    file: UploadFile = File(),
    doctor: Doctor = Depends(current_doctor),
    db: Session = Depends(get_db),
):
    stored = save_upload(file, f"doctors/{doctor.id}", ALLOWED)
    document = DoctorDocument(doctor_id=doctor.id, doc_type=doc_type, **vars(stored))
    db.add(document)
    db.commit()
    return DocumentOut.build(document)


@router.get("/{document_id}/file")
def open_my_document(document_id: int, doctor: Doctor = Depends(current_doctor), db: Session = Depends(get_db)):
    document = find_document(db, doctor, document_id)
    return send_file(document.storage_path, document.file_name, document.content_type)


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: int, doctor: Doctor = Depends(current_doctor), db: Session = Depends(get_db)):
    if doctor.verification_status == VerificationStatus.VERIFIED:
        raise AppError(409, "PROFILE_APPROVED", "Documents of an approved profile can't be deleted.")
    document = find_document(db, doctor, document_id)
    db.delete(document)
    db.commit()
    delete_file(document.storage_path)


def find_document(db: Session, doctor: Doctor, document_id: int) -> DoctorDocument:
    document = db.get(DoctorDocument, document_id)
    if not document or document.doctor_id != doctor.id:
        raise AppError(404, "NOT_FOUND", "We could not find that document.")
    return document
