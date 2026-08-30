# Day 13 - Trash UI, Restore, and Final Testing

## Completed Scope

- Connected the frontend Trash section to the backend trash API
- Added deleted file and folder rendering in list and grid views
- Added restore actions for trashed files and folders
- Added permanent delete actions for trashed files and folders
- Added pending, loading, empty, and error states for trash management
- Added backend hard-delete routes for files and folders already in trash
- Removed private shares and public links before permanently deleting items
- Exposed `deleted_at` timestamps in file and folder API responses
- Added route coverage for the new trash delete endpoints

## Backend Trash Calls

```text
GET /api/v1/trash
POST /api/v1/trash/files/{file_id}/restore
POST /api/v1/trash/folders/{folder_id}/restore
DELETE /api/v1/trash/files/{file_id}
DELETE /api/v1/trash/folders/{folder_id}
```

## Frontend Behavior

- The dashboard Trash sidebar item now opens a real trash view
- Users can switch Trash between list and grid layout
- Restore refreshes Trash, My Drive, and Search data
- Permanent delete asks for confirmation before calling the API
- Deleted files and folders show their deleted date when available

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
backend 26 passed
```
