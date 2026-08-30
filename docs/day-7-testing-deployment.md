# Day 7 - Testing and Backend Deployment

## Completed Scope

- Added pytest project configuration
- Added deployment verification tests
- Added Render Blueprint configuration
- Added production preflight script
- Added Postman collection
- Added Postman local environment
- Verified all backend tests
- Prepared backend for deployment

## Backend Test Command

```bash
cd backend
../.venv/bin/python -m pytest
```

Latest result:

```text
25 passed
```

## Postman Files

```text
backend/postman/cloud-storage-api.postman_collection.json
backend/postman/cloud-storage-api.postman_environment.json
```

Import both files into Postman, run the backend locally, then execute requests in this order:

1. Health
2. Auth - Register
3. Auth - Login
4. Auth - Me
5. Folders - Create
6. Files - Init Upload
7. Files - Complete Upload
8. Search
9. Trash - List

## Render Deployment

Deployment config:

```text
render.yaml
```

The Render service is configured as:

```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health Check Path: /api/v1/health
```

## Required Render Environment Variables

These must be set in the Render dashboard:

```text
DATABASE_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Render is configured to generate:

```text
JWT_SECRET_KEY
```

These non-secret values are included in `render.yaml`:

```text
APP_ENV=production
API_V1_PREFIX=/api/v1
CREATE_TABLES_ON_STARTUP=false
SECURE_COOKIES=true
STORAGE_PROVIDER=supabase
SUPABASE_STORAGE_BUCKET=media-files
```

## Deployment Steps

1. Open Render.
2. Create a new Blueprint.
3. Connect the GitHub repository.
4. Select branch `main`.
5. Provide the required secret environment variables.
6. Deploy.
7. After deployment, verify:

```text
https://<render-service-url>/api/v1/health
```

Expected response:

```json
{"status":"ok"}
```

## Blocked Live Deliverable

The PDF lists a live backend API as the Day 7 deliverable. The repository is ready for deployment, but creating the live Render service requires access to your Render account and production Supabase credentials.
