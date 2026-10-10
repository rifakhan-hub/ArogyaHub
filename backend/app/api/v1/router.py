from fastapi import APIRouter

from app.api.v1 import auth, doctors, me, patients
from app.api.v1.admin import doctors as admin_doctors
from app.api.v1.admin import patients as admin_patients

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(me.router)
api_router.include_router(doctors.router)
api_router.include_router(patients.router)
api_router.include_router(admin_doctors.router)
api_router.include_router(admin_patients.router)
