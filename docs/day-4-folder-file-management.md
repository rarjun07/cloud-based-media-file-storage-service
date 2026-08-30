# Day 4 - Folder System and File Management APIs

## Completed Scope

- Added `folders` model
- Added folder create, list, get, update, and delete APIs
- Added nested folders with `parent_id`
- Added breadcrumb generation
- Added folder cycle prevention when moving folders
- Added file rename API
- Added file move API
- Added file soft-delete API
- Added folder ownership checks before upload and move operations
- Added tests for folder validation, breadcrumb ordering, cycle prevention, and route registration

## Folder Endpoints

```text
POST   /api/v1/folders
GET    /api/v1/folders
GET    /api/v1/folders/{folder_id}
PATCH  /api/v1/folders/{folder_id}
DELETE /api/v1/folders/{folder_id}
```

## File Management Endpoints

```text
GET    /api/v1/files/{file_id}
PATCH  /api/v1/files/{file_id}
DELETE /api/v1/files/{file_id}
```

## Behavior Notes

- Folder deletion uses soft delete.
- File deletion uses soft delete.
- Folder and file operations are scoped to the authenticated owner.
- Moving a folder into itself or one of its descendants is rejected.
- Moving a file to a folder validates that the destination folder belongs to the current user and is not deleted.
- Passing `"folder_id": null` to the file update endpoint moves a file back to the root.
- Passing `"parent_id": null` to the folder update endpoint moves a folder back to the root.

## Verification

```bash
PYTHONPATH=backend .venv/bin/python -m pytest backend/tests
```

Latest result:

```text
13 passed
```
