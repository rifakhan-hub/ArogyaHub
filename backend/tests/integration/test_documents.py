from app.core.config import settings

URL = "/api/v1/doctors/me/documents"

PDF = ("licence.pdf", b"%PDF-1.4 licence", "application/pdf")


def upload(client, doc_type="licence", file=PDF):
    return client.post(URL, data={"doc_type": doc_type}, files={"file": file})


def test_doctor_uploads_and_lists_documents(doctor):
    res = upload(doctor)
    assert res.status_code == 201
    document = res.json()
    assert document["doc_type"] == "licence"
    assert document["file_name"] == "licence.pdf"
    assert document["size"] == len(PDF[1])

    assert [d["doc_type"] for d in doctor.get(URL).json()] == ["licence"]
    assert doctor.get(f"{URL}/{document['id']}/file").content == PDF[1]


def test_admin_opens_the_documents_while_reviewing(doctor, admin):
    upload(doctor)
    upload(doctor, "degree", ("degree.jpg", b"\xff\xd8 jpeg", "image/jpeg"))
    doctor_id = doctor.get("/api/v1/doctors/me").json()["id"]

    documents = admin.get(f"/api/v1/admin/doctors/{doctor_id}/documents").json()
    assert [d["doc_type"] for d in documents] == ["licence", "degree"]

    file = admin.get(f"/api/v1/admin/doctors/{doctor_id}/documents/{documents[0]['id']}/file")
    assert file.status_code == 200
    assert file.content == PDF[1]
    assert file.headers["content-type"] == "application/pdf"


def test_wrong_files_are_refused(doctor, monkeypatch):
    assert upload(doctor, file=("notes.txt", b"hello", "text/plain")).json()["error"]["code"] == "UNSUPPORTED_FILE"
    assert upload(doctor, file=("empty.pdf", b"", "application/pdf")).json()["error"]["code"] == "EMPTY_FILE"
    assert upload(doctor, doc_type="passport").status_code == 422

    monkeypatch.setattr(settings, "MAX_UPLOAD_MB", 0)
    assert upload(doctor).json()["error"]["code"] == "FILE_TOO_LARGE"


def test_pending_doctor_can_delete_a_document(doctor, uploads):
    document = upload(doctor).json()
    assert doctor.delete(f"{URL}/{document['id']}").status_code == 204
    assert doctor.get(URL).json() == []
    assert not any(uploads.rglob("*.pdf"))


def test_approved_doctor_cannot_delete_documents(verified):
    document = upload(verified).json()
    res = verified.delete(f"{URL}/{document['id']}")
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "PROFILE_APPROVED"


def test_only_doctors_upload_documents(patient):
    assert upload(patient).status_code == 403
