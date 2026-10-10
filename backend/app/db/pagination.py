from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session


def paginate(db: Session, query: Select, page: int, page_size: int):
    total = db.scalar(select(func.count()).select_from(query.order_by(None).subquery())) or 0
    items = db.scalars(query.offset((page - 1) * page_size).limit(page_size)).unique().all()
    return items, total
