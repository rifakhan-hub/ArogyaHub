from datetime import date

from pydantic import BaseModel

from app.models import DicomInstance, DicomSeries, DicomStudy


class InstanceOut(BaseModel):
    id: str
    sop_uid: str
    instance_number: int | None
    rows: int | None
    columns: int | None

    @classmethod
    def build(cls, instance: DicomInstance) -> "InstanceOut":
        return cls(
            id=str(instance.id),
            sop_uid=instance.sop_uid,
            instance_number=instance.instance_number,
            rows=instance.rows,
            columns=instance.columns,
        )


class SeriesOut(BaseModel):
    id: str
    series_uid: str
    series_number: int | None
    modality: str | None
    body_part: str | None
    description: str | None
    instance_count: int

    @classmethod
    def build(cls, series: DicomSeries) -> "SeriesOut":
        return cls(
            id=str(series.id),
            series_uid=series.series_uid,
            series_number=series.series_number,
            modality=series.modality,
            body_part=series.body_part,
            description=series.description,
            instance_count=series.instance_count,
        )


class StudyOut(BaseModel):
    report_id: str
    study_uid: str
    study_date: date | None
    description: str | None
    modality: str | None
    body_part: str | None
    series_count: int
    instance_count: int
    series: list[SeriesOut]

    @classmethod
    def build(cls, study: DicomStudy) -> "StudyOut":
        return cls(
            report_id=str(study.report_id),
            study_uid=study.study_uid,
            study_date=study.study_date,
            description=study.description,
            modality=study.modality,
            body_part=study.body_part,
            series_count=study.series_count,
            instance_count=study.instance_count,
            series=[SeriesOut.build(s) for s in study.series],
        )
