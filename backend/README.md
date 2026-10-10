# AarogyaHub backend

FastAPI + MySQL. It has sign-up and login for patients and doctors, doctor profiles, and the admin routes for doctors and patients.

## Tables

| Table | What it holds |
|---|---|
| `users` | Every account: name, email, phone, city, password hash, role (patient, doctor or admin), blocked or not |
| `doctors` | A doctor's profile: speciality, licence number, council, experience, fee, qualifications, bio, and review status (pending, verified or rejected) with the rejection reason |
| `patients` | A patient's health details: date of birth, gender, blood group, allergies |
| `admins` | An admin's job title |

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
| `GET /admin/doctors` | admin | Doctors, filtered by status and search |
| `GET /admin/doctors/{id}` | admin | One doctor |
| `POST /admin/doctors/{id}/verify` | admin | Approve, or reject with a reason |
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
      deps.py                get_db, get_current_user, require_admin, require_doctor
      errors.py              AppError -> { "error": { "code", "message" } }
    db/
      base.py                SQLAlchemy base class
      session.py             MySQL connection
      pagination.py          page through a query
    models/
      user.py                users table
      doctor.py              doctors table
      patient.py             patients table
      admin.py               admins table
    schemas/
      auth.py                register, login, token shapes
      doctor.py              doctor sign-up, profile, review shapes
      patient.py             patient profile shapes
      user.py                user shapes
      common.py              Page, date and blank-field helpers
    api/
      v1/
        router.py            collects every route file
        auth.py              register (patient and doctor), login, refresh, logout
        me.py                GET /users/me
        doctors.py           GET and PUT /doctors/me
        patients.py          GET and PUT /patients/me
        admin/
          doctors.py         list, detail, approve or reject
          patients.py        list, detail, block or unblock
  scripts/
    seed_users.py            creates the tables, sample users, and any missing doctor, patient and admin profiles
    create_admin.py          creates your admin account, or resets its password
  tests/
    conftest.py
    integration/             auth, patients, doctors, admin doctors, admin patients
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

Or from the repo root, without opening Postman:

```bash
npx newman run postman/AarogyaHub.postman_collection.json -e postman/AarogyaHub-local.postman_environment.json --env-var adminPassword=YOUR_ADMIN_PASSWORD
```
