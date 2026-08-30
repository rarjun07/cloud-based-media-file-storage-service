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
- Day 2: Backend setup and authentication

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
