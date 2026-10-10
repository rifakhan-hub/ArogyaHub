from datetime import datetime

from pydantic import BaseModel, field_validator

from app.models import DoctorDocument, DocumentType
from app.schemas.common import as_utc


class DocumentOut(BaseModel):
    id: str
    doc_type: DocumentType
    file_name: str
    content_type: str
    size: int
    uploaded_at: datetime

    @field_validator("uploaded_at")
    @classmethod
    def utc(cls, value):
        return as_utc(value)

    @classmethod
    def build(cls, document: DoctorDocument) -> "DocumentOut":
        return cls(
            id=str(document.id),
            doc_type=document.doc_type,
            file_name=document.file_name,
            content_type=document.content_type,
            size=document.size,
            uploaded_at=document.uploaded_at,
        )
