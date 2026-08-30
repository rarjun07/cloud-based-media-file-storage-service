# Day 3 - File Upload and Object Storage

## Completed Scope

- Added file metadata model
- Added upload status tracking with `pending`, `completed`, and `failed`
- Added file upload schemas
- Added upload validation for:
  - File name
  - MIME type allow-list
  - Maximum upload size
- Added Supabase Storage signed upload service
- Added secure object key generation
- Added init upload endpoint
- Added complete upload endpoint
- Added get file metadata endpoint
- Added tests for validation, object key generation, signed URL parsing, and route registration

## File Endpoints

```text
POST /api/v1/files/init-upload
POST /api/v1/files/complete-upload
GET  /api/v1/files/{file_id}
```

## Upload Flow

1. Authenticated user calls `/files/init-upload` with file name, MIME type, size, optional folder ID, and optional checksum.
2. Backend validates file metadata.
3. Backend creates a unique storage key under the user namespace.
4. Backend requests a signed upload URL from Supabase Storage.
5. Backend saves a pending file metadata row.
6. Frontend uploads the file directly to Supabase using the signed upload URL/token.
7. Frontend calls `/files/complete-upload`.
8. Backend marks the file metadata row as completed.

## Storage Decision

Supabase Storage remains the default object storage provider for the MVP. The storage implementation is isolated in `app.services.storage` so AWS S3 can be added later without rewriting route logic.

## Configuration

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=media-files
STORAGE_PROVIDER=supabase
MAX_UPLOAD_SIZE_BYTES=104857600
ALLOWED_UPLOAD_MIME_TYPES=image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4,audio/mpeg,text/plain,application/zip
```

## Verification

```bash
PYTHONPATH=backend .venv/bin/python -m pytest backend/tests
```

Latest result:

```text
9 passed
```
