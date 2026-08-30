# Day 11 - Sharing UI and Permissions

## Completed Scope

- Added share modal
- Added file share action
- Added folder share action
- Added email sharing form
- Added Viewer/Editor permission selector
- Added public-link creation UI
- Added optional public-link expiry field
- Added optional public-link password field
- Added copy public-link action
- Added shared-user list
- Added remove-share action
- Added frontend sharing service and hooks
- Improved backend share list filtering for a single file or folder
- Improved backend share response with shared user email

## Frontend Sharing Calls

```text
GET    /api/v1/shares?file_id={file_id}
GET    /api/v1/shares?folder_id={folder_id}
POST   /api/v1/shares
DELETE /api/v1/shares/{share_id}
POST   /api/v1/public-link
```

## UI Behavior

- Share buttons appear on file and folder rows/cards.
- The share modal opens for the selected file or folder.
- Email sharing grants either Viewer or Editor access.
- Public links can grant Viewer or Editor access.
- Public links can include expiry and optional password.
- Newly generated public links can be copied from the modal.
- Existing shared users are shown with their role.
- Owners can remove existing shares.

## Backend Addition

`GET /api/v1/shares` now accepts:

```text
file_id
folder_id
```

The response now includes:

```text
shared_with_email
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
backend 26 passed
```
