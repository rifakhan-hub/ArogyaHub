import zipfile
from collections import defaultdict
from datetime import date, datetime
from io import BytesIO
from pathlib import Path

from pydicom import Dataset, dcmread

from app.core.config import settings
from app.core.errors import AppError
from app.models import DicomInstance, DicomSeries, DicomStudy, Report

MAX_FILES = 1000
MAX_UNZIPPED_MB = 500
REQUIRED = ("StudyInstanceUID", "SeriesInstanceUID", "SOPInstanceUID")


def read_study(path: Path) -> DicomStudy:
    images = read_images(path)
    if not images:
        raise AppError(422, "INVALID_DICOM", "We couldn't find any DICOM images in this file.")
    if len({ds.StudyInstanceUID for ds, _ in images}) > 1:
        raise AppError(422, "MULTIPLE_STUDIES", "Upload one study at a time.")

    groups = defaultdict(list)
    for ds, entry in images:
        groups[ds.SeriesInstanceUID].append((ds, entry))

    first = images[0][0]
    series = [build_series(uid, items) for uid, items in groups.items()]
    return DicomStudy(
        study_uid=first.StudyInstanceUID,
        study_date=study_date(first),
        description=text(first, "StudyDescription", 200),
        modality=text(first, "Modality", 16),
        body_part=text(first, "BodyPartExamined"),
        series_count=len(series),
        instance_count=len(images),
        series=sorted(series, key=lambda s: by_number(s.series_number)),
    )


def read_instance_bytes(report: Report, instance: DicomInstance) -> bytes:
    path = settings.UPLOAD_DIR / report.storage_path
    if not path.is_file():
        raise AppError(404, "FILE_MISSING", "This file is no longer available.")
    if instance.zip_entry is None:
        return path.read_bytes()
    with zipfile.ZipFile(path) as archive:
        return archive.read(instance.zip_entry)


def read_images(path: Path) -> list[tuple[Dataset, str | None]]:
    if path.suffix.lower() != ".zip":
        ds = read_dataset(path.read_bytes())
        return [(ds, None)] if ds else []

    try:
        with zipfile.ZipFile(path) as archive:
            files = [info for info in archive.infolist() if not info.is_dir()]
            if len(files) > MAX_FILES or sum(f.file_size for f in files) > MAX_UNZIPPED_MB * 1024 * 1024:
                raise AppError(422, "ZIP_TOO_LARGE", "This zip has too many or too large files.")
            images = [(read_dataset(archive.read(info)), info.filename) for info in files]
    except zipfile.BadZipFile:
        return []
    return [(ds, entry) for ds, entry in images if ds]


def read_dataset(data: bytes) -> Dataset | None:
    try:
        ds = dcmread(BytesIO(data), stop_before_pixels=True)
    except Exception:
        return None
    if not all(ds.get(name) for name in REQUIRED):
        return None
    return ds


def build_series(uid: str, items: list[tuple[Dataset, str | None]]) -> DicomSeries:
    first = items[0][0]
    instances = [
        DicomInstance(
            sop_uid=ds.SOPInstanceUID,
            instance_number=number(ds, "InstanceNumber"),
            rows=number(ds, "Rows"),
            columns=number(ds, "Columns"),
            zip_entry=entry,
        )
        for ds, entry in items
    ]
    return DicomSeries(
        series_uid=uid,
        series_number=number(first, "SeriesNumber"),
        modality=text(first, "Modality", 16),
        body_part=text(first, "BodyPartExamined"),
        description=text(first, "SeriesDescription", 200),
        instance_count=len(instances),
        instances=sorted(instances, key=lambda i: by_number(i.instance_number)),
    )


def text(ds: Dataset, name: str, size: int = 64) -> str | None:
    value = str(ds.get(name) or "").strip()
    return value[:size] or None


def number(ds: Dataset, name: str) -> int | None:
    value = ds.get(name)
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def study_date(ds: Dataset) -> date | None:
    try:
        return datetime.strptime(str(ds.get("StudyDate") or "")[:8], "%Y%m%d").date()
    except ValueError:
        return None


def by_number(value: int | None) -> tuple[bool, int]:
    return value is None, value or 0
