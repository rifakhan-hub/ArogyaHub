"""Shapes shared by many endpoints."""

from pydantic import BaseModel


class Page[T](BaseModel):
    """One page of a list, as the frontend's Paginated<T> expects."""

    items: list[T]
    total: int
    page: int
    page_size: int
