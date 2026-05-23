# SmartHealth Copilot Instructions

## Architecture
- This repo is split into `backend/` (FastAPI + SQLAlchemy) and `frontend/` (React + Vite).
- Backend entrypoint: `backend/main.py` loads routers from `backend/app/health/api/`.
- Core backend code lives in `backend/app/health/core/`; schemas live in `backend/app/health/schemas/`; persistence models are in `backend/app/health/models/`.
- Frontend auth state is managed in `frontend/src/auth/context/AuthContext.jsx`; protected UI routes use `frontend/src/auth/components/ProtectedRoute.jsx`.

## Key backend patterns
- Auth uses JWT bearer tokens with `HTTPBearer` in `backend/app/health/core/dependencies.py` and `backend/app/health/services/auth_service.py`.
- Role-based access is centralized by `require_role("admin")`; look at `backend/app/health/api/users.py` for admin-only APIs.
- Public health endpoints: `/health/bmi`, `/health/calories`; authenticated endpoints: `/health/bmi/save`, `/health/weight/history`.
- BMI business logic uses `backend/app/health/core/bmi_calculator.py`; calories logic uses `backend/app/health/core/calories_calculator.py`.
- `backend/main.py` enables wide-open CORS for development with `allow_origins=["*"]`.

## Frontend conventions
- Generic dashboard API calls use `frontend/src/services/api.js`.
- Auth API calls use `frontend/src/auth/services/axios.js` and `frontend/src/auth/services/auth.js`.
- `AuthContext` stores session state in `localStorage.token` and restores the user via `/auth/me`.
- Note: there is a known token-storage mismatch risk: `frontend/src/services/api.js` reads `localStorage.access_token` while auth flows write `localStorage.token`.
- `updateProfileAPI` in `frontend/src/auth/services/auth.js` is currently a placeholder and does not hit a real backend endpoint.

## Project-specific workflows
- Backend setup: `cd backend && pip install -r requirements.txt`.
- Run backend: `cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000`.
- Frontend setup: `cd frontend && npm install`.
- Run frontend: `cd frontend && npm run dev`.
- Run backend tests: `cd backend && pytest app/health/tests/test_bmi_calculator.py -v`.
- DB connectivity test: `cd backend && python test_db.py`.

## Environment and integration
- Backend config is read from `backend/.env` via `backend/app/health/core/config.py`; copy `backend/.env.example` first.
- Required backend env vars: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`.
- Optional env var for future chatbot integration: `GEMINI_API_KEY`.
- Frontend can use `VITE_API_URL` to override the default backend URL `http://127.0.0.1:8000`.

## What to keep in mind
- Treat backend and frontend as separate workflows; there is no shared top-level npm or Python script.
- Auth is implemented as a bearer token flow, not a session cookie flow.
- Most health utilities are stateless except BMI history, which is persisted in `bmi_records` and tied to `users.id`.
- When editing API clients, preserve current request shapes and response models from `frontend/src/components/dashboard/*`.
