# AarogyaHub database diagram

All 15 tables and how they connect. GitHub and VS Code (with a Mermaid extension) draw this as a picture.

```mermaid
erDiagram
    users ||--o| patients : "has profile"
    users ||--o| doctors : "has profile"
    users ||--o| admins : "has profile"
    users |o--o{ doctors : "reviews (admin)"
    doctors ||--o{ doctor_documents : "uploads"
    doctors ||--o{ doctor_availability : "sets weekly hours"
    users ||--o{ appointments : "books (patient)"
    doctors ||--o{ appointments : "attends"
    users |o--o{ appointments : "cancels"
    appointments ||--o| consultations : "takes place as"
    consultations ||--o| consultation_reports : "has"
    users ||--o{ reports : "uploads (patient)"
    reports ||--o{ report_shares : "shared through"
    doctors ||--o{ report_shares : "can view"
    reports ||--o| dicom_studies : "scan details"
    dicom_studies ||--o{ dicom_series : "has"
    dicom_series ||--o{ dicom_instances : "has"

    users {
        int id PK
        string name
        string email UK
        string phone UK "nullable"
        string city "nullable"
        string password_hash "nullable"
        enum role "patient, doctor, admin"
        bool is_active
        bool is_email_verified
        string blocked_reason "nullable"
        datetime created_at
        datetime last_login_at "nullable"
    }

    patients {
        int id PK
        int user_id FK, UK
        date date_of_birth "nullable"
        string gender "nullable"
        string blood_group "nullable"
        string allergies "nullable"
    }

    admins {
        int id PK
        int user_id FK, UK
        string job_title
    }

    doctors {
        int id PK
        int user_id FK, UK
        string specialization
        string license_number UK
        string council
        int experience_years
        int consultation_fee
        string qualifications
        text bio "nullable"
        enum verification_status "pending, verified, rejected"
        string rejection_reason "nullable"
        datetime submitted_at
        datetime reviewed_at "nullable"
        int reviewed_by FK "admin user, nullable"
    }

    doctor_documents {
        int id PK
        int doctor_id FK
        enum doc_type "licence, degree, id_proof"
        string file_name
        string content_type
        int size
        string storage_path
        datetime uploaded_at
    }

    doctor_availability {
        int id PK
        int doctor_id FK
        int day_of_week "0 Monday to 6 Sunday"
        time start_time
        time end_time
        int slot_minutes "5, 10, 15, 20 or 30"
    }

    appointments {
        int id PK
        int patient_id FK "users.id"
        int doctor_id FK
        datetime start_time
        datetime end_time
        enum status "scheduled, in_progress, completed, cancelled, no_show"
        datetime active_slot "unique with doctor_id"
        string reason "nullable"
        int fee
        string cancel_reason "nullable"
        int cancelled_by FK "users.id, nullable"
        datetime created_at
    }

    consultations {
        int id PK
        int appointment_id FK, UK
        datetime started_at
        datetime ended_at "nullable"
    }

    consultation_reports {
        int id PK
        int consultation_id FK, UK
        text symptoms "nullable"
        text diagnosis
        text prescription "nullable"
        text advice "nullable"
        date follow_up_date "nullable"
        datetime updated_at
    }

    reports {
        int id PK
        int patient_id FK "users.id"
        string title
        enum report_type "pdf, image, dicom"
        string file_name
        string content_type
        int size
        string storage_path
        datetime uploaded_at
    }

    report_shares {
        int id PK
        int report_id FK
        int doctor_id FK
        datetime shared_at
    }

    dicom_studies {
        int id PK
        int report_id FK, UK
        string study_uid
        date study_date "nullable"
        string description "nullable"
        string modality "nullable"
        string body_part "nullable"
        int series_count
        int instance_count
        datetime created_at
    }

    dicom_series {
        int id PK
        int study_id FK
        string series_uid "unique with study_id"
        int series_number "nullable"
        string modality "nullable"
        string body_part "nullable"
        string description "nullable"
        int instance_count
    }

    dicom_instances {
        int id PK
        int series_id FK
        string sop_uid
        int instance_number "nullable"
        int rows "nullable"
        int columns "nullable"
        string zip_entry "nullable"
    }
```

## Relationships

| From | To | Kind | Through |
|---|---|---|---|
| users | patients | one to zero-or-one | `patients.user_id` (unique) |
| users | doctors | one to zero-or-one | `doctors.user_id` (unique) |
| users | admins | one to zero-or-one | `admins.user_id` (unique) |
| users (admin) | doctors | one to many | `doctors.reviewed_by` |
| doctors | doctor_documents | one to many | `doctor_documents.doctor_id` |
| doctors | doctor_availability | one to many | `doctor_availability.doctor_id` |
| users (patient) | appointments | one to many | `appointments.patient_id` |
| doctors | appointments | one to many | `appointments.doctor_id` |
| users | appointments | one to many | `appointments.cancelled_by` |
| appointments | consultations | one to zero-or-one | `consultations.appointment_id` (unique) |
| consultations | consultation_reports | one to zero-or-one | `consultation_reports.consultation_id` (unique) |
| users (patient) | reports | one to many | `reports.patient_id` |
| reports | report_shares | one to many | `report_shares.report_id` |
| doctors | report_shares | one to many | `report_shares.doctor_id` |
| reports | dicom_studies | one to zero-or-one | `dicom_studies.report_id` (unique) |
| dicom_studies | dicom_series | one to many | `dicom_series.study_id` |
| dicom_series | dicom_instances | one to many | `dicom_instances.series_id` |

`report_shares` links `reports` and `doctors` many to many: one report can be shared with many doctors, and a doctor can see reports from many patients.

## Rules the database enforces

- One profile per account: `user_id` is unique in `patients`, `doctors` and `admins`.
- `users.email`, `users.phone` and `doctors.license_number` are unique.
- No double booking: (`doctor_id`, `active_slot`) is unique in `appointments`. `active_slot` holds the start time while the booking is scheduled or in progress, and is empty otherwise, so a cancelled slot can be booked again.
- A report is shared with a doctor at most once: (`report_id`, `doctor_id`) is unique in `report_shares`.
- One consultation per appointment, and one report per consultation.
- One scan per DICOM report: `report_id` is unique in `dicom_studies`, and a series appears once per study: (`study_id`, `series_uid`) is unique in `dicom_series`. Deleting a report deletes its study, series and images.
