<div align="center">

# 🤖 SmartHealth

**Your friendly AI-powered health companion — inspired by Baymax**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11%2F3.12-3776AB?style=flat-square&logo=python)](https://www.python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://www.docker.com)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Docker](#-docker-deployment) · [Testing](#-testing)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Register, login, and JWT-based session management |
| 👤 **Profile Management** | Update profile fields with role-based access control |
| 📊 **BMI Tracker** | Calculate BMI and visualize history with charts |
| ⚖️ **Weight Dashboard** | Track weight over time with interactive Recharts graphs |
| 🔥 **Calorie Calculator** | Daily calorie estimation based on activity level |
| 💡 **Health Tips** | Personalized tips based on your health data |
| 📧 **OTP Verification** | Email-based one-time password for account security |
| 🤖 **AI Chatbot** | Health-focused assistant powered by OpenAI GPT-4o |

---

## 🛠 Tech Stack

**Frontend**
- React 19 + Vite · Tailwind CSS 4 · React Router 7 · Axios · Recharts

**Backend**
- FastAPI · SQLAlchemy · Pydantic v2 · JWT Auth · Alembic

**Database**
- PostgreSQL 14+ (production) · SQLite (local dev)

**AI & Infrastructure**
- OpenAI API (GPT-4o-mini) · Docker Compose

---

## 📁 Project Structure

```
SmartHealth/
├── backend/
│   ├── alembic/                # Database migration scripts
│   ├── app/health/
│   │   ├── api/                # FastAPI route handlers
│   │   ├── core/               # Config, security & business logic
│   │   ├── models/             # SQLAlchemy database models
│   │   ├── schemas/            # Pydantic validation schemas
│   │   ├── services/           # Service / business logic layer
│   │   ├── templates/          # Email templates (OTP, etc.)
│   │   └── tests/              # Pytest test suite
│   ├── main.py                 # FastAPI entrypoint
│   ├── database.py             # DB engine, session & Base setup
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── auth/               # Auth UI, context & services
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Application pages
│   │   └── services/           # Axios API client
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ & npm 10+
- Python 3.11 or 3.12
- PostgreSQL 14+ *(or SQLite for local dev)*
- Docker & Docker Compose *(optional)*

---

### Backend Setup

```bash
# 1. Navigate to backend and create virtual environment
cd backend
python -m venv venv

# 2. Activate the virtual environment
source venv/bin/activate          # macOS / Linux
.\venv\Scripts\Activate.ps1       # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
```

Edit `.env` with your credentials:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/smarthealth
SECRET_KEY=your-secure-secret-key
OPENAI_API_KEY=your-openai-api-key
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

```bash
# 5. Run database migrations
alembic upgrade head

# 6. Start the backend server
uvicorn main:app --reload
```

> 📖 API docs available at `http://localhost:8000/docs`

---

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

> 🌐 App available at `http://localhost:5173`

---

## 🐳 Docker Deployment

Run the entire stack — frontend, backend, and database — with a single command:

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

---

## 🧪 Testing

```bash
cd backend

# Make sure your virtual environment is active
pytest
```

Tests are located in `backend/app/health/tests/`.

---

## 💙 Inspiration

SmartHealth's tone and interface are inspired by **Baymax** — friendly, approachable, and genuinely caring. The goal is to feel less like a clinical tool and more like a supportive companion on your wellness journey.

---

<div align="center">
  Made with ❤️ and a healthy dose of 🤖
</div>