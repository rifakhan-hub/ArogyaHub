# AarogyaHub backend

FastAPI + MySQL. It has sign-up and login for patients and doctors, doctor profiles, and the admin routes for doctors and patients.

## Tables

| Table | What it holds |
|---|---|
| `users` | Every account: name, email, phone, city, password hash, role (patient, doctor or admin), blocked or not |
| `doctors` | A doctor's profile: speciality, licence number, council, experience, fee, qualifications, bio, and review status (pending, verified or rejected) with the rejection reason |
| `patients` | A patient's health details: date of birth, gender, blood group, allergies |
| `admins` | An admin's job title |
| `doctor_documents` | Licence, degree and ID files a doctor uploads for approval |
| `doctor_availability` | A doctor's weekly hours: day, start, end, slot length (5 to 30 minutes) |
| `appointments` | A booking: patient, doctor, start and end time (UTC), status, fee, reason |
| `consultations` | When a booked consultation started and ended |
| `consultation_reports` | The doctor's report: symptoms, diagnosis, prescription, advice, follow-up date |
| `reports` | Files a patient uploads: PDFs, images and scans |
| `report_shares` | Which doctors a patient has shared each report with |

## Routes

All routes start with `/api/v1`.

| Route | Who | What it does |
|---|---|---|
| `POST /auth/register` | anyone | Creates a patient account |
| `POST /auth/register/doctor` | anyone | Creates a doctor account and profile, waiting for review |
| `POST /auth/login` | anyone | Returns an access token and sets a refresh cookie |
| `POST /auth/refresh` | anyone with the cookie | Returns a new access token |
| `POST /auth/logout` | anyone | Clears the refresh cookie |
| `GET /users/me` | signed in | The signed-in user's account |
| `GET /patients/me` | patient | The patient's own account and health details |
| `PUT /patients/me` | patient | Updates name, phone, city and health details |
| `GET /doctors/me` | doctor | The doctor's own profile and review status. `NO_DOCTOR_PROFILE` if there isn't one yet |
| `PUT /doctors/me` | doctor | Creates or updates the profile. A new or rejected profile goes for review |
| `GET /doctors` | anyone | Approved doctors, by search and speciality |
| `GET /doctors/{id}` | anyone | One approved doctor |
| `GET /doctors/{id}/slots?date=` | anyone | Free slots on a day |
| `GET`, `POST /doctors/me/availability` | approved doctor | Weekly hours |
| `DELETE /doctors/me/availability/{id}` | approved doctor | Remove hours |
| `GET`, `POST /doctors/me/documents` | doctor | List or upload documents (PDF, JPG, PNG) |
| `GET /doctors/me/documents/{id}/file` | doctor | Open own document |
| `DELETE /doctors/me/documents/{id}` | doctor, not yet approved | Remove a document |
| `POST /appointments` | patient | Book a free slot |
| `GET /appointments/me` | patient or doctor | Own appointments (`status`, `upcoming` filters) |
| `GET /appointments/{id}` | its patient or doctor | One appointment |
| `POST /appointments/{id}/cancel` | its patient or doctor | Cancel before it starts |
| `POST /appointments/{id}/no-show` | its doctor | Mark a no-show after the start time |
| `POST /appointments/{id}/consultation/start` | its doctor | Start, from 10 minutes before until the end time |
| `POST /appointments/{id}/consultation/end` | its doctor | End; the appointment becomes completed |
| `GET /appointments/{id}/consultation` | its patient or doctor | Start and end times |
| `PUT /appointments/{id}/consultation/report` | its doctor | Write or update the consultation report |
| `GET /appointments/{id}/consultation/report` | its patient or doctor | Read the consultation report |
| `POST /reports` | patient | Upload a report (PDF, JPG, PNG, DCM, ZIP) |
| `GET /reports/me` | patient | Own reports, with who they're shared with |
| `GET /reports/shared-with-me` | doctor | Reports patients shared with this doctor |
| `GET /reports/{id}/file` | owner, or a doctor it's shared with | Open the file |
| `DELETE /reports/{id}` | owner | Delete a report and its file |
| `POST /reports/{id}/shares` | owner | Share with an approved doctor |
| `DELETE /reports/{id}/shares/{doctor_id}` | owner | Stop sharing |
| `GET /admin/doctors` | admin | Doctors, filtered by status and search |
| `GET /admin/doctors/{id}` | admin | One doctor |
| `POST /admin/doctors/{id}/verify` | admin | Approve, or reject with a reason |
| `GET /admin/doctors/{id}/documents` | admin | A doctor's uploaded documents |
| `GET /admin/doctors/{id}/documents/{doc_id}/file` | admin | Open a document while reviewing |
| `GET /admin/patients` | admin | Patients, filtered by search and status |
| `GET /admin/patients/{id}` | admin | One patient, with health details |
| `PATCH /admin/patients/{id}/block` | admin | Block (with a reason) or unblock |
| `GET /health` | anyone | Is the API up and can it reach MySQL |

## How doctor approval works

1. The doctor signs up in 4 steps on the website. Everything is sent once, to `/auth/register/doctor`.
2. The profile starts as `pending`. The doctor can log in, but sees "under review" instead of the doctor portal.
3. An admin opens Doctors in the admin console and approves the profile, or rejects it with a reason.
4. Approved: the doctor portal opens. Rejected: the doctor sees the reason, fixes the details and sends them again (`PUT /doctors/me`), which sets the status back to `pending`.
5. A profile can only be approved or rejected while it is `pending`.

## How booking works

1. An approved doctor adds weekly hours. Times are in Indian time (IST).
2. `GET /doctors/{id}/slots?date=` turns those hours into slots for that day, leaving out past and booked slots.
3. The patient books one of those exact slot times. Anything else gets `SLOT_NOT_AVAILABLE`.
4. Two people can't book the same slot: `appointments.active_slot` holds the start time while the booking is active, and a unique key on (doctor, active_slot) blocks a second booking. Cancelling clears it, so the slot opens again.
5. The doctor starts the consultation from 10 minutes before the slot, ends it, and writes the consultation report. The patient can read it.

## Uploaded files

Files are saved under `backend/uploads/` (set `UPLOAD_DIR` in `.env` to change it), up to `MAX_UPLOAD_MB` (20 MB). The folder isn't in git. Only the owner, a doctor a report is shared with, or an admin reviewing a doctor can open a file.

## How login works

1. **Register:** the password is hashed with argon2 and saved in `users.password_hash`. The plain password is never stored.
2. **Log in:** the backend checks the password and sends back two tokens:
   - an **access token** (lasts 15 minutes). The frontend keeps it in memory and sends it as `Authorization: Bearer <token>`.
   - a **refresh token** (lasts 7 days) in an HttpOnly cookie, which page scripts can't read.
3. **Page reload:** the frontend calls `/auth/refresh`. The browser sends the cookie, and the backend returns a new access token.
4. **Protected routes:** `get_current_user` reads the access token. `require_admin` and `require_doctor` allow only that role.
5. **Log out:** the cookie is cleared.
6. **Blocked users** can't log in or refresh.

## Files

```
backend/
  app/
    main.py                  app, CORS, error format, routes
    core/
      config.py              settings from .env
      security.py            password hashing, tokens
      deps.py                get_db, get_current_user, role checks, current_doctor, verified_doctor
      storage.py             save, send and delete uploaded files
      errors.py              AppError -> { "error": { "code", "message" } }
    db/
      base.py                SQLAlchemy base class
      session.py             MySQL connection
      pagination.py          page through a query
    models/
      user.py                users table
      doctor.py              doctors table
      patient.py             patients table
      document.py            doctor_documents table
      availability.py        doctor_availability table
      appointment.py         appointments table
      consultation.py        consultations and consultation_reports tables
      report.py              reports and report_shares tables
      admin.py               admins table
    schemas/
      auth.py                register, login, token shapes
      doctor.py              doctor sign-up, profile, review shapes
      patient.py             patient profile shapes
      document.py, availability.py, appointment.py, consultation.py, report.py
      user.py                user shapes
      common.py              Page, date and blank-field helpers
    api/
      v1/
        router.py            collects every route file
        auth.py              register (patient and doctor), login, refresh, logout
        me.py                GET /users/me
        doctors.py           GET and PUT /doctors/me
        patients.py          GET and PUT /patients/me
        documents.py         doctor documents
        availability.py      doctor weekly hours
        appointments.py      book, list, cancel, no-show
        consultations.py     start, end, consultation report
        reports.py           patient reports and sharing
        admin/
          doctors.py         list, detail, approve or reject
          patients.py        list, detail, block or unblock
    services/
      slots.py               turns weekly hours into free slots (IST)
      appointments.py        shared lookups for doctors and appointments
  scripts/
    seed_users.py            creates the tables, sample users, and any missing doctor, patient and admin profiles
    create_admin.py          creates your admin account, or resets its password
  tests/
    conftest.py
    integration/             one test file per area
  pyproject.toml
  .env.example
```

## Setup

Run these from the `backend` folder.

1. Create the database on your MySQL server:

   ```sql
   CREATE DATABASE aarogyahub CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   ```

2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL`: your MySQL details
   - `JWT_SECRET`: a long random string. Make one with:

     ```bash
     python -c "import secrets; print(secrets.token_urlsafe(48))"
     ```

3. Install, then create the tables, the sample users and your admin:

   ```bash
   python -m venv .venv
   .venv/Scripts/python -m pip install -e ".[dev]"
   .venv/Scripts/python -m scripts.seed_users
   .venv/Scripts/python -m scripts.create_admin
   ```

   `create_admin` asks for an email and a password. The sample users have no password, so they can't log in. Register new accounts on the frontend's `/register` page.

## Run

```bash
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

Restart the server after you change `.env`.

## Tests

```bash
.venv/Scripts/python -m pytest
```

## Postman

The collection is in `postman/` at the repo root.

1. In Postman: **Import** → pick both files in `postman/`.
2. Choose the **AarogyaHub local** environment, and set `adminEmail` and `adminPassword` to the admin you created.
3. With the server running, open the **AarogyaHub API** collection → **Run**.

The login requests save the access token, and every other request sends it automatically.

The upload requests use the sample files in `postman/files/`. In the Postman app, set your working directory to the repo root (Settings → General → Working directory) so it can find them.

Or from the repo root, without opening Postman:

```bash
npx newman run postman/AarogyaHub.postman_collection.json -e postman/AarogyaHub-local.postman_environment.json --env-var adminPassword=YOUR_ADMIN_PASSWORD
```
