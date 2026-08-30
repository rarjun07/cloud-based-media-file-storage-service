# Day 12 - Search, Sorting, and Optimization

## Completed Scope

- Connected frontend search bar to backend search API
- Added file type filter
- Added sorting by updated date
- Added sorting by name
- Added sorting by file size
- Added ascending/descending sort toggle
- Added show-more pagination for loaded results
- Added combined rendering for normal drive items and search results
- Added search loading and empty states
- Added file timestamps to backend file responses for consistent UI sorting

## Frontend Search Calls

```text
GET /api/v1/search?q={query}
GET /api/v1/search?mime_type={mime_type}
GET /api/v1/search?q={query}&mime_type={mime_type}
```

## Sorting

Supported sort modes:

```text
updated
name
size
```

Supported directions:

```text
ascending
descending
```

## Pagination

The dashboard initially renders 12 items and exposes a show-more action for additional loaded items.

## Backend Addition

`FileRead` now includes:

```text
created_at
updated_at
```

This allows the frontend to display and sort file rows consistently with folders and search results.

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
