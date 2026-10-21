from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.core.errors import AppError
from app.models import DicomInstance, DicomSeries, Report, User
from app.schemas.dicom import InstanceOut, StudyOut
from app.services.dicom import read_instance_bytes
from app.services.reports import find_visible_report

router = APIRouter(prefix="/reports/{report_id}/dicom", tags=["dicom"])


@router.get("", response_model=StudyOut)
def get_study(report_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return StudyOut.build(find_scan(db, report_id, user).study)


@router.get("/series/{series_id}", response_model=list[InstanceOut])
def list_instances(
    report_id: int,
    series_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    series = find_series(find_scan(db, report_id, user), series_id)
    return [InstanceOut.build(i) for i in series.instances]


@router.get("/instances/{instance_id}/file")
def download_instance(
    report_id: int,
    instance_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = find_scan(db, report_id, user)
    instance = db.get(DicomInstance, instance_id)
    if not instance or instance.series_id not in {s.id for s in report.study.series}:
        raise AppError(404, "NOT_FOUND", "We could not find that image.")
    return Response(
        read_instance_bytes(report, instance),
        media_type="application/dicom",
        headers={"Content-Disposition": f'attachment; filename="{instance.sop_uid}.dcm"'},
    )


def find_scan(db: Session, report_id: int, user: User) -> Report:
    report = find_visible_report(db, report_id, user)
    if not report.study:
        raise AppError(404, "NOT_DICOM", "This report isn't a DICOM scan.")
    return report


def find_series(report: Report, series_id: int) -> DicomSeries:
    series = next((s for s in report.study.series if s.id == series_id), None)
    if not series:
        raise AppError(404, "NOT_FOUND", "We could not find that series.")
    return series
