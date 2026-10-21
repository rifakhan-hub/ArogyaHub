from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models import Report, Role, User


def find_visible_report(db: Session, report_id: int, user: User) -> Report:
    report = db.get(Report, report_id)
    allowed = report and (
        report.patient_id == user.id
        or (user.role == Role.DOCTOR and any(s.doctor.user_id == user.id for s in report.shares))
    )
    if not allowed:
        raise AppError(404, "NOT_FOUND", "We could not find that report.")
    return report
