from tests.conftest import kapoor_id

URL = "/api/v1/reports"

PDF = ("cbc.pdf", b"%PDF-1.4 blood test", "application/pdf")


def upload(client, title="Blood test - CBC", file=PDF):
    return client.post(URL, data={"title": title}, files={"file": file})


def test_patient_uploads_and_lists_reports(patient):
    res = upload(patient)
    assert res.status_code == 201
    report = res.json()
    assert report["report_type"] == "pdf"
    assert report["shared_with"] == []

    upload(patient, "Chest X-ray", ("chest.dcm", b"DICM data", "application/dicom"))
    reports = patient.get(f"{URL}/me").json()
    assert [r["report_type"] for r in reports] == ["dicom", "pdf"]
    assert patient.get(f"{URL}/{report['id']}/file").content == PDF[1]


def test_share_with_a_doctor_and_stop_sharing(patient, verified):
    report = upload(patient).json()
    doctor_id = kapoor_id(patient)

    shared = patient.post(f"{URL}/{report['id']}/shares", json={"doctor_id": int(doctor_id)})
    assert shared.status_code == 201
    assert [s["doctor_name"] for s in shared.json()["shared_with"]] == ["Dr. Ravi Kapoor"]
    again = patient.post(f"{URL}/{report['id']}/shares", json={"doctor_id": int(doctor_id)})
    assert again.json()["error"]["code"] == "ALREADY_SHARED"

    inbox = verified.get(f"{URL}/shared-with-me").json()
    assert [(r["title"], r["patient_name"]) for r in inbox] == [("Blood test - CBC", "Priya Sharma")]
    assert verified.get(f"{URL}/{report['id']}/file").content == PDF[1]

    stopped = patient.delete(f"{URL}/{report['id']}/shares/{doctor_id}")
    assert stopped.json()["shared_with"] == []
    assert verified.get(f"{URL}/shared-with-me").json() == []
    assert verified.get(f"{URL}/{report['id']}/file").status_code == 404


def test_doctors_only_see_reports_shared_with_them(patient, doctor):
    report = upload(patient).json()
    assert doctor.get(f"{URL}/{report['id']}/file").status_code == 404


def test_reports_can_only_be_shared_with_approved_doctors(patient, doctor):
    report = upload(patient).json()
    pending_doctor_id = doctor.get("/api/v1/doctors/me").json()["id"]
    res = patient.post(f"{URL}/{report['id']}/shares", json={"doctor_id": int(pending_doctor_id)})
    assert res.status_code == 404


def test_other_patients_cannot_touch_a_report(patient, admin):
    report = upload(patient).json()
    assert admin.get(f"{URL}/{report['id']}/file").status_code == 404
    assert admin.delete(f"{URL}/{report['id']}").status_code == 403


def test_delete_removes_the_file(patient, verified, uploads):
    report = upload(patient).json()
    patient.post(f"{URL}/{report['id']}/shares", json={"doctor_id": int(kapoor_id(patient))})
    assert patient.delete(f"{URL}/{report['id']}").status_code == 204
    assert patient.get(f"{URL}/me").json() == []
    assert not any(uploads.rglob("*.pdf"))


def test_report_files_are_checked(patient):
    assert upload(patient, file=("notes.txt", b"hi", "text/plain")).json()["error"]["code"] == "UNSUPPORTED_FILE"
    assert upload(patient, title="A").status_code == 422
