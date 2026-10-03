"""Collects every v1 route file. Add new route files here."""

from fastapi import APIRouter

from app.api.v1.admin import users as admin_users

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(admin_users.router)
