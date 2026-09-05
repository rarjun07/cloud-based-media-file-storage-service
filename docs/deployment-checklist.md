# Deployment Checklist

This project should be deployed as a full-stack React + FastAPI app:

- Frontend: Vercel
- Backend: Render
- Database: Supabase PostgreSQL
- Object storage: Supabase Storage

Streamlit is not a suitable deployment target for this codebase unless the React frontend is rewritten as a Streamlit app.

## 1. Supabase

Create a Supabase project and collect these values:

```text
DATABASE_URL=postgresql+asyncpg://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=media-files
```

Create a private Supabase Storage bucket named:

```text
media-files
```

If Supabase shows the database URL as `postgresql://...`, the backend will normalize it to `postgresql+asyncpg://...` at runtime.

## 2. Google OAuth

Create OAuth credentials in Google Cloud Console.

Add this authorized redirect URI after the Render backend URL is known:

```text
https://your-render-service.onrender.com/api/v1/auth/google/callback
```

Required backend environment variables:

```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-render-service.onrender.com/api/v1/auth/google/callback
```

## 3. Render Backend

Create a Render Blueprint from `render.yaml`.

Set these secret or deployment-specific values in Render:

```text
DATABASE_URL=postgresql+asyncpg://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
FRONTEND_URL=https://your-vercel-app.vercel.app
BACKEND_URL=https://your-render-service.onrender.com
CORS_ORIGINS=https://your-vercel-app.vercel.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-render-service.onrender.com/api/v1/auth/google/callback
```

Render generates `JWT_SECRET_KEY` from `render.yaml`.

The backend start command runs database migrations automatically:

```text
python -m alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

After deployment, verify:

```text
https://your-render-service.onrender.com/api/v1/health
```

Expected response:

```json
{"status":"ok"}
```

## 4. Vercel Frontend

Import the GitHub repository into Vercel.

The root `vercel.json` already configures:

```text
Install command: cd frontend && npm install
Build command: cd frontend && npm run build
Output directory: frontend/dist
```

Set this Vercel environment variable:

```text
VITE_API_BASE_URL=https://your-render-service.onrender.com/api/v1
```

Deploy the frontend, then update Render with the final Vercel URL in:

```text
FRONTEND_URL
CORS_ORIGINS
```

## 5. Final Smoke Test

Run these checks after both services are live:

1. Open the Vercel URL.
2. Register a new user.
3. Log in with email and password.
4. Upload a PDF or image.
5. Download the uploaded file.
6. Star and unstar the file.
7. Share the file with another registered user.
8. Log in as the shared user and open the Shared page.
9. Generate a public link and open it in a private browser window.
10. Move the file to Trash, restore it, then permanently delete it.
11. Test Google login.
