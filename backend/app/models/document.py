import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import utcnow


class DocumentType(enum.StrEnum):
    LICENCE = "licence"
    DEGREE = "degree"
    ID_PROOF = "id_proof"


class DoctorDocument(Base):
    __tablename__ = "doctor_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), index=True)
    doc_type: Mapped[DocumentType] = mapped_column(Enum(DocumentType, values_callable=lambda e: [m.value for m in e]))
    file_name: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(100))
    size: Mapped[int]
    storage_path: Mapped[str] = mapped_column(String(500))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
