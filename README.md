# Cloud Based Media File Storage Service

Full-stack cloud file storage MVP based on the mentor specification.

## Confirmed Stack

- Backend: Python FastAPI
- Frontend: React, planned with Vite
- Database: PostgreSQL, planned through Supabase
- Object storage: Supabase Storage by default
- ORM: SQLAlchemy
- Validation: Pydantic
- Auth: JWT access and refresh tokens, Google OAuth later

## Day-by-Day Delivery Rule

Each day is completed as a separate Git commit before starting the next day.

Current status:

- Day 1: Requirement analysis and database design files completed
- Git: Day 1 committed locally
- Day 2: Backend setup and authentication completed locally

## Project Layout

```text
backend/
  app/
    core/
    models/
    routes/
    schemas/
    services/
    utils/
docs/
```

## Day 1 Deliverables

- Requirements and MVP decisions: `docs/day-1-requirements.md`
- ER diagram: `docs/er-diagram.md`
- Backend FastAPI scaffold: `backend/app/`
- Git commit: `Day 1: initialize project planning and backend scaffold`

## Day 2 Deliverables

- PostgreSQL async database setup with SQLAlchemy
- User model
- Auth schemas
- Password hashing with bcrypt
- JWT access and refresh token helpers
- Auth routes: register, login, refresh, me, logout
- Protected current-user dependency
- Tests for route registration and security helpers

## Backend Local Setup

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
PYTHONPATH=backend .venv/bin/uvicorn app.main:app --reload
```

API docs:

```text
http://127.0.0.1:8000/docs
```

Run tests:

```bash
PYTHONPATH=backend .venv/bin/python -m pytest backend/tests
```
