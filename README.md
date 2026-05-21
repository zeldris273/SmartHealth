# SmartHealth

SmartHealth is a full-stack health tracking and wellness assistant inspired by Baymax. The project includes a React/Vite frontend and a FastAPI backend, with features for authentication, BMI tracking, calorie calculation, health tips, OTP verification, and an AI-powered health chatbot.

## Overview

- Frontend: React 19, Vite, Tailwind CSS 4, React Router, Axios, Recharts
- Backend: FastAPI, SQLAlchemy, Pydantic, JWT authentication
- Database: PostgreSQL
- AI integration: Google Gemini API
- Default local URLs:
  - Frontend: `http://localhost:5173`
  - Backend API: `http://localhost:8000`
  - Swagger Docs: `http://localhost:8000/docs`

## Main Features

- User registration and login
- JWT-based authentication
- Basic role-based access control for `user` and `admin`
- BMI calculation and BMI history tracking
- Weight history dashboard
- Daily calorie estimation
- Personalized health tips
- Email OTP send and verify flow
- Health chatbot backend powered by Google Gemini

## Project Structure

```text
SmartHealth/
|- backend/
|  |- app/health/
|  |  |- api/           # API routes
|  |  |- core/          # config, security, dependencies, business logic helpers
|  |  |- models/        # SQLAlchemy models
|  |  |- schemas/       # Pydantic schemas
|  |  |- services/      # service layer
|  |  |- templates/     # email templates
|  |  `- tests/         # backend tests
|  |- main.py           # FastAPI entrypoint
|  |- database.py       # database engine, session, Base
|  |- requirements.txt
|  `- .env.example
|- frontend/
|  |- src/
|  |  |- auth/          # auth UI, context, services
|  |  |- components/    # reusable UI components
|  |  |- pages/         # Home, Dashboard, Chatbot
|  |  `- services/      # API client
|  |- package.json
|  `- vite.config.js
`- README.md
```

## Requirements

- Node.js 20+
- npm 10+
- Python 3.11 or 3.12
- PostgreSQL 14+ recommended

## Backend Setup

Move into the `backend` folder and create a virtual environment:

```powershell
cd backend
python -m venv venv
```

Activate the virtual environment before doing anything else in the backend:

```powershell
.\venv\Scripts\Activate.ps1
```

After `venv` is active, install dependencies:

```powershell
pip install -r requirements.txt
```

Create your environment file:

```powershell
Copy-Item .env.example .env
```

Update `.env` with your PostgreSQL and service credentials:

```env
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/smarthealth
SECRET_KEY=replace-with-a-secure-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GEMINI_API_KEY=your-gemini-api-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=SmartHealth
OTP_EXPIRE_MINUTES=5
OTP_RESEND_COOLDOWN_SECONDS=60
```

Notes:

- `DATABASE_URL` should point to a PostgreSQL database that already exists.
- `GEMINI_API_KEY` is required for the chatbot backend.
- `SMTP_USER` and `SMTP_PASSWORD` are required for email OTP delivery.
- Every backend command after setup should be run with the virtual environment activated.

Run the backend:

```powershell
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

## Frontend Setup

Move into the `frontend` folder:

```powershell
cd frontend
npm install
npm run dev
```

The frontend currently uses `http://localhost:8000` as its API base URL in [api.js](D:\Workspace\SmartHealth\frontend\src\services\api.js). If your backend runs on a different port or host, update that file accordingly.

## Running the Project

Use two terminals.

Terminal 1, backend:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

Terminal 2, frontend:

```powershell
cd frontend
npm run dev
```

Then open:

- Frontend: `http://localhost:5173`
- Swagger Docs: `http://localhost:8000/docs`

## API Summary

The backend currently exposes these main routes:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /health/bmi`
- `POST /health/bmi/save`
- `GET /health/bmi/history`
- `GET /health/weight/history`
- `POST /health/calories`
- `GET /health/tips`
- `POST /health/chat`
- `POST /otp/send`
- `POST /otp/verify`
- `GET /users/{user_id}`
- `PATCH /users/{user_id}/role`

Use Swagger UI for the latest request and response schemas.

## Testing

Backend tests are located in `backend/app/health/tests`.

Make sure the virtual environment is active before running tests:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pytest
```

Run individual tests if needed:

```powershell
pytest app/health/tests/test_bmi_calculator.py -v
pytest app/health/tests/test_chatbot.py -v
```

## Current Notes

- The frontend already has a chatbot page, but [Chatbot.jsx](D:\Workspace\SmartHealth\frontend\src\pages\chatbot\Chatbot.jsx) is still using mock messages and is not yet connected directly to `POST /health/chat`.
- `backend/requirements.txt` appears to be generated in a `pip freeze` style, so it likely includes transitive packages that are not strictly necessary as top-level dependencies.
- Backend CORS is currently configured with `allow_origins=["*"]`, which is convenient for local development but should be restricted before deployment.

## Suggested Next Improvements

- Connect the frontend chatbot to the Gemini backend API
- Clean up `backend/requirements.txt`
- Add database migrations
- Add deployment instructions for Docker or cloud hosting
- Expand tests for auth, OTP, and calorie flows

## Inspiration

The product tone and interface direction are inspired by Baymax, aiming for a friendly, approachable, and supportive health companion experience.
