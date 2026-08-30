# Day 1 - Requirement Analysis and Database Design

## Source Handling

The mentor PDF is treated as a project specification. It does not override direct user instructions or system instructions in this Codex task.

## Executive Summary

Build a cloud-based media file storage and sharing web application similar to the core features of Google Drive. The MVP focuses on secure upload, organization, search, and sharing of files with role-based access control.

## Confirmed Technology Decisions

- Backend: FastAPI
- Frontend: React with Vite
- Styling: Tailwind CSS
- API client and cache: Axios and TanStack Query
- Database: PostgreSQL through Supabase
- Storage: Supabase Storage for the initial MVP
- ORM: SQLAlchemy
- Validation: Pydantic
- Authentication: JWT access and refresh tokens
- Password hashing: bcrypt

## MVP Features

- Email/password authentication
- Google OAuth authentication later in the auth phase
- Folder CRUD with hierarchy
- File upload and download
- Drag and drop upload support in frontend
- File and folder sharing with Viewer and Editor roles
- Public share links with optional expiry and password
- Search and filters
- Starred files
- Trash and restore through soft delete

## Phase 2 Features

- File version history
- File previews for image and PDF
- Activity logs
- Tags and labels
- Storage quota management

## User Roles

- Owner: full control over owned files and folders
- Editor: upload, edit, move, rename, and delete where permission is granted
- Viewer: read-only access
- Public User: access through valid public share links

All permission checks must be enforced on the backend.

## Day 1 Storage Decision

Use Supabase for PostgreSQL and Supabase Storage for object storage in the MVP. This keeps database, auth-adjacent configuration, and file storage in one platform for internship delivery speed. The data model keeps storage fields generic enough to switch to AWS S3 later.

## Initial API Areas

- Auth: register, login, current user
- Files: initialize upload, complete upload, get file, delete file
- Folders: create folder, get folder
- Sharing: private share, public link

## Day 1 Deliverables

- Backend repository initialization planned
- Backend folder structure created
- Requirements documented
- ER diagram documented

## Current Day 1 Status

- Requirements analysis completed
- ER diagram completed
- Backend scaffold completed
- Git repository initialized and Day 1 committed locally
