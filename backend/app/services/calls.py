from datetime import timedelta

from fastapi import WebSocket
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import read_token
from app.models import Appointment, AppointmentStatus, User
from app.models.user import utcnow

JOIN_EARLY = timedelta(minutes=10)
JOIN_GRACE = timedelta(minutes=15)
RELAYED = {"offer", "answer", "ice", "hangup"}

rooms: dict[int, dict[str, WebSocket]] = {}


class CallRefused(Exception):
    def __init__(self, code: int, reason: str):
        self.code = code
        self.reason = reason


def ice_servers() -> list[dict]:
    servers = [{"urls": url.strip()} for url in settings.STUN_URLS.split(",") if url.strip()]
    if settings.TURN_URL:
        servers.append(
            {"urls": settings.TURN_URL, "username": settings.TURN_USERNAME, "credential": settings.TURN_PASSWORD}
        )
    return servers


def caller_role(db: Session, appointment_id: int, token: object) -> str:
    user_id = read_token(token, "access") if isinstance(token, str) else None
    user = db.get(User, user_id) if user_id else None
    if not user or not user.is_active:
        raise CallRefused(4401, "Log in again to join the call.")

    appointment = db.get(Appointment, appointment_id)
    if not appointment or user.id not in (appointment.patient_id, appointment.doctor.user_id):
        raise CallRefused(4404, "We could not find that appointment.")
    if appointment.status != AppointmentStatus.IN_PROGRESS or utcnow() > appointment.end_time + JOIN_GRACE:
        raise CallRefused(4409, "This consultation isn't live.")
    return "doctor" if user.id == appointment.doctor.user_id else "patient"


async def enter(appointment_id: int, role: str, socket: WebSocket) -> None:
    room = rooms.setdefault(appointment_id, {})
    old = room.get(role)
    room[role] = socket
    if old:
        await close(old, 4000, "You joined the call in another tab.")
    peer = room.get(other(role))
    await socket.send_json({"type": "ready", "peer": peer is not None})
    if peer:
        await send(peer, {"type": "peer-joined"})


async def relay(appointment_id: int, role: str, message: object) -> None:
    peer = rooms.get(appointment_id, {}).get(other(role))
    if peer and isinstance(message, dict) and message.get("type") in RELAYED:
        await send(peer, message)


async def leave(appointment_id: int, role: str, socket: WebSocket) -> None:
    room = rooms.get(appointment_id, {})
    if room.get(role) is not socket:
        return
    del room[role]
    peer = room.get(other(role))
    if peer:
        await send(peer, {"type": "peer-left"})
    else:
        rooms.pop(appointment_id, None)


def other(role: str) -> str:
    return "patient" if role == "doctor" else "doctor"


async def send(socket: WebSocket, message: dict) -> None:
    try:
        await socket.send_json(message)
    except Exception:
        pass


async def close(socket: WebSocket, code: int, reason: str) -> None:
    try:
        await socket.close(code, reason)
    except Exception:
        pass
