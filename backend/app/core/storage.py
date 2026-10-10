import uuid
from dataclasses import dataclass
from pathlib import Path

from fastapi import UploadFile
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.errors import AppError

CONTENT_TYPES = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".dcm": "application/dicom",
    ".zip": "application/zip",
}

CHUNK = 1024 * 1024


@dataclass
class StoredFile:
    file_name: str
    content_type: str
    size: int
    storage_path: str


def save_upload(file: UploadFile, folder: str, allowed: set[str]) -> StoredFile:
    name = Path(file.filename or "").name
    extension = Path(name).suffix.lower()
    if extension not in allowed:
        kinds = ", ".join(sorted(allowed))
        raise AppError(422, "UNSUPPORTED_FILE", f"Upload one of these file types: {kinds}.")

    relative = Path(folder) / f"{uuid.uuid4().hex}{extension}"
    target = settings.UPLOAD_DIR / relative
    target.parent.mkdir(parents=True, exist_ok=True)

    limit = settings.MAX_UPLOAD_MB * CHUNK
    size = 0
    with target.open("wb") as out:
        while chunk := file.file.read(CHUNK):
            size += len(chunk)
            if size > limit:
                out.close()
                target.unlink(missing_ok=True)
                raise AppError(413, "FILE_TOO_LARGE", f"Files can be up to {settings.MAX_UPLOAD_MB} MB.")
            out.write(chunk)

    if size == 0:
        target.unlink(missing_ok=True)
        raise AppError(422, "EMPTY_FILE", "This file is empty.")

    return StoredFile(name, CONTENT_TYPES[extension], size, relative.as_posix())


def send_file(storage_path: str, file_name: str, content_type: str) -> FileResponse:
    path = settings.UPLOAD_DIR / storage_path
    if not path.is_file():
        raise AppError(404, "FILE_MISSING", "This file is no longer available.")
    return FileResponse(path, media_type=content_type, filename=file_name)


def delete_file(storage_path: str) -> None:
    (settings.UPLOAD_DIR / storage_path).unlink(missing_ok=True)
