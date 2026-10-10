from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import current_doctor, get_current_user, get_db, require_patient
from app.core.errors import AppError
from app.core.storage import delete_file, save_upload, send_file
from app.models import Doctor, Report, ReportShare, ReportType, Role, User
from app.schemas.report import ReportOut, SharedReportOut, ShareRequest
from app.services.appointments import find_listed_doctor

router = APIRouter(prefix="/reports", tags=["reports"])

TYPES = {".pdf": ReportType.PDF, ".jpg": ReportType.IMAGE, ".jpeg": ReportType.IMAGE, ".png": ReportType.IMAGE}
TYPES |= {".dcm": ReportType.DICOM, ".zip": ReportType.DICOM}


@router.post("", response_model=ReportOut, status_code=201)
def upload_report(
    title: str = Form(min_length=2, max_length=200),
    file: UploadFile = File(),
    patient: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    stored = save_upload(file, f"reports/{patient.id}", set(TYPES))
    report = Report(
        patient_id=patient.id,
        title=title.strip(),
        report_type=TYPES[Path(stored.file_name).suffix.lower()],
        **vars(stored),
    )
    db.add(report)
    db.commit()
    return ReportOut.build(report)


@router.get("/me", response_model=list[ReportOut])
def my_reports(patient: User = Depends(require_patient), db: Session = Depends(get_db)):
    reports = db.scalars(
        select(Report).where(Report.patient_id == patient.id).order_by(Report.uploaded_at.desc(), Report.id.desc())
    ).all()
    return [ReportOut.build(r) for r in reports]


@router.get("/shared-with-me", response_model=list[SharedReportOut])
def shared_with_me(doctor: Doctor = Depends(current_doctor), db: Session = Depends(get_db)):
    rows = db.execute(
        select(Report, User, ReportShare)
        .join(ReportShare, ReportShare.report_id == Report.id)
        .join(User, User.id == Report.patient_id)
        .where(ReportShare.doctor_id == doctor.id)
        .order_by(ReportShare.shared_at.desc())
    ).all()
    return [SharedReportOut.build(report, patient, share) for report, patient, share in rows]


@router.get("/{report_id}/file")
def open_report(report_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    report = db.get(Report, report_id)
    allowed = report and (
        report.patient_id == user.id
        or (user.role == Role.DOCTOR and any(s.doctor.user_id == user.id for s in report.shares))
    )
    if not allowed:
        raise AppError(404, "NOT_FOUND", "We could not find that report.")
    return send_file(report.storage_path, report.file_name, report.content_type)


@router.delete("/{report_id}", status_code=204)
def delete_report(report_id: int, patient: User = Depends(require_patient), db: Session = Depends(get_db)):
    report = find_own_report(db, report_id, patient)
    db.delete(report)
    db.commit()
    delete_file(report.storage_path)


@router.post("/{report_id}/shares", response_model=ReportOut, status_code=201)
def share_report(
    report_id: int,
    body: ShareRequest,
    patient: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    report = find_own_report(db, report_id, patient)
    doctor = find_listed_doctor(db, body.doctor_id)
    if any(s.doctor_id == doctor.id for s in report.shares):
        raise AppError(409, "ALREADY_SHARED", "This report is already shared with that doctor.")
    report.shares.append(ReportShare(doctor_id=doctor.id))
    db.commit()
    db.refresh(report)
    return ReportOut.build(report)


@router.delete("/{report_id}/shares/{doctor_id}", response_model=ReportOut)
def stop_sharing(
    report_id: int,
    doctor_id: int,
    patient: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    report = find_own_report(db, report_id, patient)
    share = next((s for s in report.shares if s.doctor_id == doctor_id), None)
    if not share:
        raise AppError(404, "NOT_SHARED", "This report isn't shared with that doctor.")
    report.shares.remove(share)
    db.commit()
    return ReportOut.build(report)


def find_own_report(db: Session, report_id: int, patient: User) -> Report:
    report = db.get(Report, report_id)
    if not report or report.patient_id != patient.id:
        raise AppError(404, "NOT_FOUND", "We could not find that report.")
    return report
