# SmartHealth

SmartHealth is a full-stack health tracking and wellness assistant inspired by Baymax. The project includes a React/Vite frontend and a FastAPI backend, with features for authentication, BMI tracking, calorie calculation, health tips, OTP verification, and an AI-powered health chatbot.

## Overview

- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router 7, Axios, Recharts
- **Backend:** FastAPI, SQLAlchemy, Pydantic v2, JWT authentication, Alembic migrations
- **Database:** PostgreSQL (Production/Docker) or SQLite (Local Development)
- **AI Integration:** OpenAI API (GPT-4o-mini/GPT-4.1-mini)
- **Default local URLs:**
  - Frontend: `http://localhost:5173`
  - Backend API: `http://localhost:8000`
  - Swagger Docs: `http://localhost:8000/docs`

## Main Features

- **User Authentication:** Registration, Login, and JWT-based session management.
- **Profile Management:** Update profile fields and basic role-based access control.
- **Health Tools:**
  - BMI calculation and BMI history tracking.
  - Weight history dashboard with Recharts.
  - Daily calorie estimation based on physical activity.
  - Personalized health tips.
- **Security:**
  - Email OTP verification for account security.
  - Protected routes on the frontend.
- **AI Chatbot:** Health-focused chatbot powered by OpenAI, providing supportive and professional advice.

## Project Structure

```text
SmartHealth/
├── backend/
│   ├── alembic/            # Database migration scripts
│   ├── app/health/
│   │   ├── api/            # API routes (FastAPI routers)
│   │   ├── core/           # Config, security, and business logic helpers
│   │   ├── models/         # SQLAlchemy database models
│   │   ├── schemas/        # Pydantic validation schemas
│   │   ├── services/       # Service layer (business logic)
│   │   ├── templates/      # Email templates (OTP, etc.)
│   │   └── tests/          # Pytest suite
│   ├── main.py             # FastAPI entrypoint
│   ├── database.py        # DB engine, session, and Base setup
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── auth/           # Auth UI, context, and services
│   │   ├── components/     # Reusable UI components (Dashboard, Chatbot, etc.)
│   │   ├── pages/          # Application pages (Home, Dashboard)
│   │   └── services/       # API client (Axios)
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

## Requirements

- Node.js 20+
- npm 10+
- Python 3.11 or 3.12
- PostgreSQL 14+ (or SQLite for local development)
- Docker & Docker Compose (optional for local deployment)

## Backend Setup

1. **Move into the `backend` folder and create a virtual environment:**
   ```powershell
   cd backend
   python -m venv venv
   ```

2. **Activate the virtual environment:**
   ```powershell
   # Windows
   .\venv\Scripts\Activate.ps1
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Environment Setup:**
   Copy `.env.example` to `.env` and update the values:
   ```powershell
   cp .env.example .env
   ```

   Key environment variables:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/smarthealth
   SECRET_KEY=your-secure-secret-key
   OPENAI_API_KEY=your-openai-api-key
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

5. **Database Migrations:**
   Apply migrations to set up your database schema:
   ```powershell
   alembic upgrade head
   ```

6. **Run the Backend:**
   ```powershell
   uvicorn main:app --reload
   ```

## Frontend Setup

1. **Move into the `frontend` folder:**
   ```powershell
   cd frontend
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Run the Frontend:**
   ```powershell
   npm run dev
   ```

## Docker Deployment

You can run the entire stack (Frontend, Backend, and Database) using Docker Compose:

```powershell
docker-compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

## Testing

Backend tests are located in `backend/app/health/tests`.

```powershell
cd backend
# Ensure venv is active
pytest
```

## Inspiration

The product tone and interface direction are inspired by Baymax, aiming for a friendly, approachable, and supportive health companion experience.
