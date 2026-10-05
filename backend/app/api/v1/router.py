from fastapi import APIRouter

from app.api.v1 import users
from app.api.v1.admin import users as admin_users

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(users.router)
api_router.include_router(admin_users.router)
