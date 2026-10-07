# AarogyaHub backend

FastAPI + MySQL. It has sign-up, login and the admin users routes.

## Routes

All routes start with `/api/v1`.

| Route | Who | What it does |
|---|---|---|
| `POST /auth/register` | anyone | Creates a patient or doctor account |
| `POST /auth/login` | anyone | Returns an access token and sets a refresh cookie |
| `POST /auth/refresh` | anyone with the cookie | Returns a new access token |
| `POST /auth/logout` | anyone | Clears the refresh cookie |
| `GET /users/me` | signed in | The signed-in user's account |
| `GET /admin/users` | admin | Search, filter, sort and page through users |
| `GET /admin/users/{id}` | admin | One user |
| `PATCH /admin/users/{id}/block` | admin | Block or unblock a user |
| `GET /health` | anyone | Is the API up and can it reach MySQL |

## How login works

1. **Register:** the password is hashed with argon2 and saved in `users.password_hash`. The plain password is never stored.
2. **Log in:** the backend checks the password and sends back two tokens:
   - an **access token** (lasts 15 minutes). The frontend keeps it in memory and sends it as `Authorization: Bearer <token>`.
   - a **refresh token** (lasts 7 days) in an HttpOnly cookie, which page scripts can't read.
3. **Page reload:** the frontend calls `/auth/refresh`. The browser sends the cookie, and the backend returns a new access token.
4. **Protected routes:** `get_current_user` reads the access token. `require_admin` allows admins only.
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
      deps.py                get_db, get_current_user, require_admin
      errors.py              AppError -> { "error": { "code", "message" } }
    db/
      base.py                SQLAlchemy base class
      session.py             MySQL connection
    models/
      user.py                users table
    schemas/
      auth.py                register, login, token shapes
      user.py                user shapes
      common.py              Page (paged lists)
    api/
      v1/
        router.py            collects every route file
        auth.py              register, login, refresh, logout
        me.py                GET /users/me
        admin/
          users.py           admin users routes
  scripts/
    seed_users.py            creates the tables and sample users
    create_admin.py          creates your admin account, or resets its password
  tests/
    conftest.py
    integration/test_auth.py
    integration/test_users.py
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
