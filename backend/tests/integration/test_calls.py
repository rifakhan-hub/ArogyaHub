import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.core.config import settings
from app.main import app
from app.services import calls
from tests.integration.test_consultations import appointment_now, url

OFFER = {"type": "offer", "sdp": {"type": "offer", "sdp": "v=0"}}
ANSWER = {"type": "answer", "sdp": {"type": "answer", "sdp": "v=0"}}
ICE = {"type": "ice", "candidate": {"candidate": "candidate:1", "sdpMid": "0", "sdpMLineIndex": 0}}


def token(client: TestClient) -> str:
    return client.headers["Authorization"].removeprefix("Bearer ")


def open_signal(sockets: TestClient, appointment_id: str, client: TestClient):
    socket = sockets.websocket_connect(url(appointment_id, "/signal"))
    ws = socket.__enter__()
    ws.send_json({"type": "auth", "token": token(client)})
    return socket, ws


def refused_code(sockets: TestClient, appointment_id: str, auth: dict) -> int:
    with sockets.websocket_connect(url(appointment_id, "/signal")) as ws:
        ws.send_json(auth)
        with pytest.raises(WebSocketDisconnect) as closed:
            ws.receive_json()
    return closed.value.code


def test_patient_waits_until_the_doctor_starts(session, verified, patient):
    appointment_id = appointment_now(session)

    assert patient.post(url(appointment_id, "/join")).json() == {
        "status": "scheduled",
        "waiting": True,
        "ice_servers": [],
    }
    assert verified.post(url(appointment_id, "/join")).json()["error"]["code"] == "NOT_STARTED"

    verified.post(url(appointment_id, "/start"))
    call = patient.post(url(appointment_id, "/join")).json()
    assert call["waiting"] is False
    assert call["ice_servers"] == [{"urls": "stun:stun.l.google.com:19302"}]


def test_turn_server_is_added_when_set(session, verified, monkeypatch):
    monkeypatch.setattr(settings, "TURN_URL", "turn:turn.example.com:3478")
    monkeypatch.setattr(settings, "TURN_USERNAME", "aarogya")
    monkeypatch.setattr(settings, "TURN_PASSWORD", "secret")
    appointment_id = appointment_now(session)
    verified.post(url(appointment_id, "/start"))
    servers = verified.post(url(appointment_id, "/join")).json()["ice_servers"]
    assert servers[-1] == {"urls": "turn:turn.example.com:3478", "username": "aarogya", "credential": "secret"}


def test_doctor_and_patient_exchange_signals(session, verified, patient):
    appointment_id = appointment_now(session)
    verified.post(url(appointment_id, "/start"))

    with TestClient(app) as sockets:
        doctor_socket, doctor_ws = open_signal(sockets, appointment_id, verified)
        assert doctor_ws.receive_json() == {"type": "ready", "peer": False}

        patient_socket, patient_ws = open_signal(sockets, appointment_id, patient)
        assert patient_ws.receive_json() == {"type": "ready", "peer": True}
        assert doctor_ws.receive_json() == {"type": "peer-joined"}

        doctor_ws.send_json(OFFER)
        assert patient_ws.receive_json() == OFFER
        patient_ws.send_json(ANSWER)
        assert doctor_ws.receive_json() == ANSWER
        patient_ws.send_json({"type": "something-else"})
        patient_ws.send_json(ICE)
        assert doctor_ws.receive_json() == ICE

        patient_socket.__exit__(None, None, None)
        assert doctor_ws.receive_json() == {"type": "peer-left"}

        patient_socket, patient_ws = open_signal(sockets, appointment_id, patient)
        assert patient_ws.receive_json() == {"type": "ready", "peer": True}
        assert doctor_ws.receive_json() == {"type": "peer-joined"}
        doctor_ws.send_json({"type": "hangup"})
        assert patient_ws.receive_json() == {"type": "hangup"}

        patient_socket.__exit__(None, None, None)
        doctor_socket.__exit__(None, None, None)
    assert calls.rooms == {}


def test_signal_refuses_calls_that_are_not_live(session, verified, patient, doctor):
    appointment_id = appointment_now(session)
    with TestClient(app) as sockets:
        assert refused_code(sockets, appointment_id, {"type": "auth", "token": token(patient)}) == 4409

        verified.post(url(appointment_id, "/start"))
        assert refused_code(sockets, appointment_id, {"type": "auth", "token": "not-a-token"}) == 4401
        assert refused_code(sockets, appointment_id, {"type": "auth"}) == 4401
        assert refused_code(sockets, appointment_id, {"type": "auth", "token": token(doctor)}) == 4404

        verified.post(url(appointment_id, "/end"))
        assert refused_code(sockets, appointment_id, {"type": "auth", "token": token(verified)}) == 4409
