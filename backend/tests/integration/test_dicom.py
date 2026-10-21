from io import BytesIO

from pydicom import dcmread
from pydicom.uid import generate_uid
from sqlalchemy import func, select

from app.models import DicomInstance, DicomSeries, DicomStudy
from tests.conftest import kapoor_id, make_dicom, make_zip

URL = "/api/v1/reports"


def upload(client, name, data, content_type="application/dicom"):
    return client.post(URL, data={"title": "CT Chest"}, files={"file": (name, data, content_type)})


def upload_ct_zip(client):
    study = generate_uid()
    first, second = generate_uid(), generate_uid()
    files = {
        "ct/2.dcm": make_dicom(study, first, series_number=1, instance_number=2),
        "ct/1.dcm": make_dicom(study, first, series_number=1, instance_number=1),
        "ct/3.dcm": make_dicom(study, second, series_number=2, instance_number=1),
        "ct/readme.txt": b"not a scan",
    }
    return upload(client, "chest.zip", make_zip(files), "application/zip")


def test_upload_a_single_dcm(patient):
    report = upload(patient, "chest.dcm", make_dicom()).json()
    assert report["report_type"] == "dicom"

    study = patient.get(f"{URL}/{report['id']}/dicom").json()
    assert study["study_date"] == "2026-01-10"
    assert (study["modality"], study["body_part"], study["description"]) == ("CT", "CHEST", "CT Chest")
    assert (study["series_count"], study["instance_count"]) == (1, 1)

    series_id = study["series"][0]["id"]
    instances = patient.get(f"{URL}/{report['id']}/dicom/series/{series_id}").json()
    assert [(i["instance_number"], i["rows"], i["columns"]) for i in instances] == [(1, 2, 2)]


def test_upload_a_zip_groups_images_by_series(patient):
    report = upload_ct_zip(patient).json()
    study = patient.get(f"{URL}/{report['id']}/dicom").json()
    assert (study["series_count"], study["instance_count"]) == (2, 3)
    assert [(s["series_number"], s["instance_count"]) for s in study["series"]] == [(1, 2), (2, 1)]

    series_id = study["series"][0]["id"]
    instances = patient.get(f"{URL}/{report['id']}/dicom/series/{series_id}").json()
    assert [i["instance_number"] for i in instances] == [1, 2]

    res = patient.get(f"{URL}/{report['id']}/dicom/instances/{instances[1]['id']}/file")
    assert res.headers["content-type"] == "application/dicom"
    assert dcmread(BytesIO(res.content)).SOPInstanceUID == instances[1]["sop_uid"]


def test_only_the_owner_and_shared_doctors_can_see_a_scan(patient, verified, doctor, admin):
    report = upload(patient, "chest.dcm", make_dicom()).json()
    assert verified.get(f"{URL}/{report['id']}/dicom").status_code == 404
    assert doctor.get(f"{URL}/{report['id']}/dicom").status_code == 404
    assert admin.get(f"{URL}/{report['id']}/dicom").status_code == 404

    patient.post(f"{URL}/{report['id']}/shares", json={"doctor_id": int(kapoor_id(patient))})
    assert verified.get(f"{URL}/{report['id']}/dicom").json()["instance_count"] == 1


def test_files_that_are_not_dicom_are_rejected(patient, uploads):
    res = upload(patient, "chest.dcm", b"DICM data")
    assert res.json()["error"]["code"] == "INVALID_DICOM"
    res = upload(patient, "chest.zip", make_zip({"a.txt": b"hello"}), "application/zip")
    assert res.json()["error"]["code"] == "INVALID_DICOM"
    assert patient.get(f"{URL}/me").json() == []
    assert not any(p.is_file() for p in uploads.rglob("*"))


def test_a_zip_with_two_studies_is_rejected(patient):
    files = {"a.dcm": make_dicom(), "b.dcm": make_dicom()}
    res = upload(patient, "mixed.zip", make_zip(files), "application/zip")
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "MULTIPLE_STUDIES"


def test_a_pdf_report_has_no_scan(patient):
    report = upload(patient, "cbc.pdf", b"%PDF-1.4 blood test", "application/pdf").json()
    assert patient.get(f"{URL}/{report['id']}/dicom").json()["error"]["code"] == "NOT_DICOM"


def test_series_and_images_must_belong_to_the_report(patient):
    first = upload(patient, "a.dcm", make_dicom()).json()
    second = upload(patient, "b.dcm", make_dicom()).json()
    series_id = patient.get(f"{URL}/{second['id']}/dicom").json()["series"][0]["id"]
    assert patient.get(f"{URL}/{first['id']}/dicom/series/{series_id}").status_code == 404
    assert patient.get(f"{URL}/{first['id']}/dicom/instances/999/file").status_code == 404


def test_deleting_the_report_removes_the_scan_rows(patient, session):
    report = upload_ct_zip(patient).json()
    assert patient.delete(f"{URL}/{report['id']}").status_code == 204
    with session() as db:
        for model in (DicomStudy, DicomSeries, DicomInstance):
            assert db.scalar(select(func.count()).select_from(model)) == 0
