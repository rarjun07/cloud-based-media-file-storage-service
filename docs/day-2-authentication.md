# Day 2 - Backend Setup and Authentication

## Completed Scope

- FastAPI backend app wired with versioned routes under `/api/v1`
- Async SQLAlchemy engine and session factory configured for PostgreSQL
- `users` model added
- Registration endpoint added
- Login endpoint added
- Password hashing added with bcrypt
- JWT access and refresh token helpers added
- Refresh token endpoint added
- Current-user dependency added for protected routes
- `/auth/me` protected endpoint added
- Logout endpoint clears auth cookies
- Focused tests added for security helpers and route registration

## Auth Endpoints

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

## Token Behavior

- Login returns `access_token` and `refresh_token` in the JSON response.
- Login also stores both tokens in HttpOnly cookies for browser clients.
- Protected routes accept either `Authorization: Bearer <token>` or the access-token cookie.
- Refresh accepts either a JSON `refresh_token` or the refresh-token cookie.

## Database Notes

- The database URL is configured through `DATABASE_URL`.
- The expected database is PostgreSQL.
- Supabase PostgreSQL can be used by replacing `DATABASE_URL` in `backend/.env`.
- `CREATE_TABLES_ON_STARTUP=true` can be used during early development to create tables automatically after the target database exists.
- Alembic migrations are listed in dependencies and can be added before deployment-hardening.

## Verification

```bash
PYTHONPATH=backend .venv/bin/python -m pytest backend/tests
```

Latest result:

```text
5 passed
```
