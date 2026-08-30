# Day 5 - Sharing and Permissions

## Completed Scope

- Added private share model
- Added public link share model
- Added Viewer and Editor roles
- Added permission service for file and folder access checks
- Added private share APIs
- Added public link APIs
- Added optional public link password support
- Added public link expiry support
- Applied Viewer permission to read file and folder metadata
- Applied Editor permission to modify files and folders
- Added tests for share validation, public link expiry, and route registration

## Sharing Endpoints

```text
POST   /api/v1/shares
GET    /api/v1/shares
DELETE /api/v1/shares/{share_id}
```

## Public Link Endpoints

```text
POST /api/v1/public-link
POST /api/v1/public-link/{token}
```

## Permission Rules

- Owner has full control.
- Editor can read, rename, move, upload into shared folders, and soft delete.
- Viewer can read only.
- Public links can grant Viewer or Editor role.
- Owner role cannot be granted through normal sharing or public links.
- Public link raw tokens are returned once and only token hashes are stored.
- Public links can expire.
- Public links can require a password.

## File Route Authorization

```text
GET    /api/v1/files/{file_id}       requires Viewer or higher
PATCH  /api/v1/files/{file_id}       requires Editor or higher
DELETE /api/v1/files/{file_id}       requires Editor or higher
POST   /api/v1/files/init-upload     requires Editor on destination folder when uploading into a folder
POST   /api/v1/files/complete-upload requires Editor or higher
```

## Folder Route Authorization

```text
GET    /api/v1/folders/{folder_id}   requires Viewer or higher
PATCH  /api/v1/folders/{folder_id}   requires Editor or higher
DELETE /api/v1/folders/{folder_id}   requires Editor or higher
POST   /api/v1/folders               requires Editor on parent folder when creating inside a folder
GET    /api/v1/folders               root listing stays scoped to the current user
```

## Verification

```bash
PYTHONPATH=backend .venv/bin/python -m pytest backend/tests
```

Latest result:

```text
17 passed
```
