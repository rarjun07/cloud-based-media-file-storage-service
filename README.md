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
- Day 1: pushed to GitHub
- Day 2: backend setup and authentication pushed to GitHub
- Day 3: file upload and object storage pushed to GitHub
- Day 4: folder system and file management pushed to GitHub
- Day 5: sharing and permissions pushed to GitHub
- Day 6: search, trash, and optimization pushed to GitHub
- Day 7: backend testing and deployment readiness completed locally

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

## Day 3 Deliverables

- File metadata model
- Upload status tracking
- File upload request/response schemas
- Supabase Storage signed-upload service
- File upload validation for size, type, and safe names
- File routes: init upload, complete upload, get file metadata
- Tests for upload validation, storage key generation, signed URL parsing, and route registration

## Day 4 Deliverables

- Folder metadata model
- Folder routes: create, list, get with breadcrumbs, update, delete
- Nested folder support through `parent_id`
- Breadcrumb service for folder navigation
- Folder cycle prevention
- File rename and move endpoint
- File soft-delete endpoint
- Folder ownership validation for file uploads and moves
- Tests for folder validation, breadcrumbs, cycle prevention, and route registration

## Day 5 Deliverables

- Share and public-link models
- Viewer and Editor permission roles
- Permission service for file and folder access
- Private share APIs
- Public share link APIs with expiry and optional password
- File and folder route authorization based on Viewer/Editor permissions
- Tests for share validation, public-link expiry, and route registration

## Day 6 Deliverables

- Search API for files and folders
- Name-based search
- MIME type search for files
- Trash listing API
- Restore deleted files
- Restore deleted folders
- Restore logic that moves items to root if their old parent is still deleted
- Database indexes for file, folder, share, and public-link query paths
- Tests for indexes, restore behavior, and route registration

## Day 7 Deliverables

- Render Blueprint deployment config
- Production preflight script
- Pytest configuration
- Postman collection and local environment
- Deployment documentation
- Tests for deployment config and API testing artifacts

## Backend Local Setup

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
cd backend
../.venv/bin/uvicorn app.main:app --reload
```

API docs:

```text
http://127.0.0.1:8000/docs
```

Run tests:

```bash
cd backend
../.venv/bin/python -m pytest
```

Deployment preflight:

```bash
cd backend
../.venv/bin/python scripts/preflight.py
```
