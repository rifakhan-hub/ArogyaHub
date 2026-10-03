"""Things routes ask for with Depends()."""

from app.db.session import SessionLocal


def get_db():
    """A database session for one request. Use it as `db: Session = Depends(get_db)`."""
    with SessionLocal() as db:
        yield db
