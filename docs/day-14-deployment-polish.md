# Day 14 - Deployment and Polish

## Completed Scope

- Added root `vercel.json` for frontend deployment from the monorepo
- Added `frontend/.env.production.example` for production API configuration
- Added Alembic production migrations for backend database setup
- Added shared frontend loading, empty, and error state components
- Applied the shared state components to session checks, drive loading, trash loading, empty states, and error messages
- Improved small-screen dashboard navigation layout
- Added safer async error handling for auth and sharing forms
- Added upload rejection handling for invalid file type, oversized file, and too many files
- Updated README with final deployment configuration details

## Vercel Settings

Import the GitHub repository into Vercel and use the included `vercel.json`.

Required production environment variable:

```text
VITE_API_BASE_URL=https://your-backend-api.example.com/api/v1
```

Build settings are encoded in `vercel.json`:

```text
Install command: cd frontend && npm install
Build command: cd frontend && npm run build
Output directory: frontend/dist
```

## Backend Settings

For the deployed backend, configure:

```text
APP_ENV=production
CREATE_TABLES_ON_STARTUP=false
SECURE_COOKIES=true
CORS_ORIGINS=https://your-vercel-domain.vercel.app
FRONTEND_URL=https://your-vercel-domain.vercel.app
BACKEND_URL=https://your-render-service.onrender.com
DATABASE_URL=postgresql+asyncpg://...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=media-files
JWT_SECRET_KEY=strong-production-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-render-service.onrender.com/api/v1/auth/google/callback
```

## Deployment Status

The repository is deployment-ready locally for the Render + Vercel + Supabase path. Live deployment still requires access to the user's Render, Vercel, Supabase, and Google Cloud credentials.

## Verification

```bash
cd frontend
npm run lint
npm run build
```

```bash
cd backend
../.venv/bin/python -m pytest
```

Latest result:

```text
frontend lint passed
frontend build passed
backend tests passed
```
