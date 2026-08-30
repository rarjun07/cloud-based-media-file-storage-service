# Day 10 - File Upload and Preview UI

## Completed Scope

- Added React Dropzone
- Added upload dropzone to My Drive
- Added selected file details
- Added upload progress indicator
- Added image preview
- Added PDF preview
- Added generic file preview fallback
- Added frontend signed-upload flow
- Added dashboard refresh after successful upload
- Added backend CORS configuration for local Vite frontend

## Upload Flow

```text
Frontend file selection
POST /api/v1/files/init-upload
PUT file to signed storage upload URL
POST /api/v1/files/complete-upload
Refresh drive listing
```

## Preview Behavior

- Images are previewed with an object URL.
- PDFs are previewed in an iframe.
- Other allowed file types show a file preview fallback.

## Local CORS

The backend allows local frontend origins:

```text
http://127.0.0.1:5173
http://localhost:5173
```

Cookies are supported with:

```text
allow_credentials=True
```

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
backend 25 passed
```
