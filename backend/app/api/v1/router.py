from fastapi import APIRouter

from app.api.v1 import appointments, auth, availability, consultations, doctors, documents, me, patients, reports
from app.api.v1.admin import doctors as admin_doctors
from app.api.v1.admin import patients as admin_patients

api_router = APIRouter(prefix="/api/v1")
for module in (
    auth,
    me,
    availability,
    documents,
    doctors,
    patients,
    appointments,
    consultations,
    reports,
    admin_doctors,
    admin_patients,
):
    api_router.include_router(module.router)
