"""The AarogyaHub API. Start it from the backend folder:

    .venv/Scripts/python -m uvicorn app.main:app --reload --port 8000

API docs: http://localhost:8000/docs
"""

import logging

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.deps import get_db
from app.core.errors import add_error_handlers

logger = logging.getLogger("uvicorn.error")  # prints in the uvicorn window

app = FastAPI(title="AarogyaHub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

add_error_handlers(app)
app.include_router(api_router)


@app.get("/api/v1/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "ok"}
    except Exception as error:
        # the reason shows in the server window, not in the response
        logger.error("Database check failed: %s", error)
        return {"status": "ok", "db": "down"}
