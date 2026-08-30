# Day 8 - Frontend Setup and Auth UI

## Completed Scope

- Initialized React frontend with Vite
- Added TypeScript configuration
- Added Tailwind CSS configuration
- Added Axios API client
- Added TanStack Query provider
- Added login and signup UI
- Added current-user session check
- Added logout action
- Integrated frontend auth calls with backend auth routes

## Frontend Auth Behavior

- Login calls `POST /api/v1/auth/login`.
- Signup calls `POST /api/v1/auth/register`, then logs the user in.
- Session check calls `GET /api/v1/auth/me`.
- Logout calls `POST /api/v1/auth/logout`.
- Axios uses `withCredentials: true`.
- Tokens are not stored in localStorage. The backend HttpOnly cookies handle the browser session.

## Local Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173
```

Backend expected URL:

```text
http://127.0.0.1:8000/api/v1
```

Override backend URL:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

## Verification

```bash
cd frontend
npm run build
```
