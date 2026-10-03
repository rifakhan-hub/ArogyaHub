# AarogyaHub backend

FastAPI + MySQL. For now it has the users part only: the admin users routes the admin panel calls.

## Files

```
backend/
  app/
    main.py                  app, CORS, error format, routes
    core/
      config.py              settings from .env
      deps.py                get_db
      errors.py              AppError -> { "error": { "code", "message" } }
    db/
      base.py                SQLAlchemy base class
      session.py             MySQL connection
    models/
      user.py                users table
    schemas/
      common.py              Page (paged lists)
      user.py                user shapes sent and received
    api/
      v1/
        router.py            collects every route file
        admin/
          users.py           GET /admin/users, GET /admin/users/{id}, PATCH /admin/users/{id}/block
  scripts/
    seed_users.py            creates the tables and sample users
  tests/
    conftest.py
    integration/test_users.py
  pyproject.toml
  .env.example
```

There's no login yet, so the admin routes are open. Add an admin check to them when auth is built.

## Setup

Run these from the `backend` folder.

1. Create the database on your MySQL server:

   ```sql
   CREATE DATABASE aarogyahub CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   ```

2. Copy `.env.example` to `.env` and put your MySQL details in `DATABASE_URL`.

3. Install, then create the tables and sample users:

   ```bash
   python -m venv .venv
   .venv/Scripts/python -m pip install -e ".[dev]"
   .venv/Scripts/python -m scripts.seed_users
   ```

## Run

```bash
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Tests

```bash
.venv/Scripts/python -m pytest
```

## Postman

The collection is in `postman/` at the repo root.

1. In Postman: **Import** → pick both files in `postman/`.
2. Choose the **AarogyaHub local** environment (top right).
3. With the server running and the sample users loaded, open the **AarogyaHub API** collection → **Run**.

Or from the repo root, without opening Postman:

```bash
npx newman run postman/AarogyaHub.postman_collection.json -e postman/AarogyaHub-local.postman_environment.json
```
