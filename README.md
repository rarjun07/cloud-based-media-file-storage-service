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
- Day 7: backend testing and deployment readiness pushed to GitHub
- Day 8: frontend setup and auth UI pushed to GitHub
- Day 9: dashboard and file listing UI pushed to GitHub
- Day 10: file upload and preview UI pushed to GitHub
- Day 11: sharing UI and permissions pushed to GitHub

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

## Day 8 Deliverables

- React frontend initialized with Vite
- TypeScript setup
- Tailwind CSS setup
- Axios API client
- TanStack Query setup
- Login and signup UI
- Current-user session check
- Logout action
- Cookie-based auth integration with backend

## Day 9 Deliverables

- Drive-style dashboard layout
- Sidebar navigation for My Drive, Shared, and Trash
- File and folder listing UI
- Breadcrumb navigation
- List and grid view toggle
- Frontend file/folder services
- React Query hooks for drive data
- Backend `GET /api/v1/files` listing endpoint for folder contents

## Day 10 Deliverables

- React Dropzone drag-and-drop upload UI
- Upload progress indicator
- Image preview
- PDF preview
- Signed upload frontend flow
- Dashboard list refresh after upload
- Backend CORS configuration for local frontend auth cookies

## Day 11 Deliverables

- Share modal for files and folders
- Email sharing UI
- Viewer/Editor permission selector
- Public link generation UI
- Optional public-link expiry and password fields
- Copy public-link action
- Shared-user listing
- Remove-share action
- Backend share listing filters for one file or folder
- Backend share responses include shared user email

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

## Frontend Local Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173
```
