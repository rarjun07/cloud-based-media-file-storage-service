# Day 6 - Search, Trash, and Optimization

## Completed Scope

- Added search API
- Added name-based search for files and folders
- Added MIME type filtering for files
- Added trash listing API
- Added file restore API
- Added folder restore API
- Added restore behavior for deleted parent folders
- Added database indexes for common query paths
- Added tests for indexes, restore behavior, and route registration

## Search Endpoint

```text
GET /api/v1/search?q={query}&mime_type={mime_type}
```

## Search Behavior

- Searches active, non-deleted files and folders.
- Includes items owned by the current user.
- Includes directly shared files and folders.
- `q` filters by name.
- `mime_type` filters files only.
- Results are sorted by latest update time.

## Trash Endpoints

```text
GET  /api/v1/trash
POST /api/v1/trash/files/{file_id}/restore
POST /api/v1/trash/folders/{folder_id}/restore
```

## Trash Behavior

- Trash listing returns the current user's deleted files and folders.
- Restoring a file clears `is_deleted` and `deleted_at`.
- Restoring a folder clears `is_deleted` and `deleted_at`.
- If a restored file's old folder is still deleted, the file is moved to root.
- If a restored folder's old parent is still deleted, the folder is moved to root.

## Optimization

Added indexes for:

- File owner, deleted state, and name search
- File owner, deleted state, and MIME type search
- File folder and deleted state
- Folder owner, parent, deleted state, and name
- Shared file lookups
- Shared folder lookups
- Share owner listing
- Public link active and expiry filtering

## Verification

```bash
PYTHONPATH=backend .venv/bin/python -m pytest backend/tests
```

Latest result:

```text
21 passed
```
