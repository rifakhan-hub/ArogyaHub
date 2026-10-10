from datetime import UTC, datetime

from pydantic import BaseModel


class Page[T](BaseModel):
    items: list[T]
    total: int
    page: int
    page_size: int


def as_utc(value: datetime | None) -> datetime | None:
    return value.replace(tzinfo=UTC) if value and value.tzinfo is None else value


def blank_to_none(value):
    if isinstance(value, str):
        return value.strip() or None
    return value
