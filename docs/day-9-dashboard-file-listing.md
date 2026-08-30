# Day 9 - Dashboard and File Listing UI

## Completed Scope

- Replaced the Day 8 dashboard placeholder with a Drive-style dashboard
- Added sidebar navigation
- Added My Drive view
- Added Shared and Trash navigation entries
- Added folder listing UI
- Added file listing UI
- Added breadcrumb navigation
- Added list and grid view toggle
- Added frontend services for folders and files
- Added React Query hooks for drive data
- Added backend file listing endpoint needed by the dashboard

## Frontend Views

```text
My Drive
Shared
Trash
```

## Frontend Data Calls

```text
GET /api/v1/folders
GET /api/v1/folders?parent_id={folder_id}
GET /api/v1/folders/{folder_id}
GET /api/v1/files
GET /api/v1/files?folder_id={folder_id}
```

## Backend Addition

Added:

```text
GET /api/v1/files
```

Behavior:

- Root file listing returns active files owned by the current user.
- Folder file listing requires Viewer permission on the folder.
- Deleted files are excluded.
- Results are sorted by name.

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
