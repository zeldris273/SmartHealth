<div align="center">

# 🤖 SmartHealth

**Your friendly AI-powered health companion — inspired by Baymax**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11%2F3.12-3776AB?style=flat-square&logo=python)](https://www.python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://www.docker.com)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Environment Variables](#-environment-variables) · [Docker](#-docker-deployment) · [Testing](#-testing)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Secure Register, login, and JWT-based session management. |
| 🌐 **Google OAuth 2.0** | One-click login using Google accounts for better UX. |
| 👤 **Profile Management** | Comprehensive profile tracking including age, weight, height, fitness goals, body frame metrics (wrist/ankle), underlying diseases, and food allergies. |
| 📊 **BMI Tracker** | Real-time BMI calculation with interactive historical charts. |
| ⚖️ **Weight Dashboard** | Monitor weight fluctuations over time with sleek Recharts visualizations. |
| 🔥 **Calorie Calculator** | Personalized TDEE/BMR estimation based on activity level and body metrics. |
| 💡 **Health Tips** | AI-curated health advice tailored to your current health status. |
| 📧 **OTP Verification** | Enhanced security with email-based One-Time Passwords for account recovery/verification. |
| 🎧 **Customer Support** | Real-time ticketing system with WebSocket chat, admin management, and email notifications. |
| 🤖 **AI Chatbot (RAG)** | Smart assistant powered by GPT-4o-mini with Retrieval-Augmented Generation (RAG) for precise medical knowledge. |
| 📂 **Document Management** | Admin capability to upload and manage health documents for the AI to reference. |
| 📈 **Admin Analytics** | High-level community health insights: BMI distributions, demographic trends, popular goals, and health condition aggregates. |

---

## 🛠 Tech Stack

**Frontend**
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS 4 (with soft "Baymax" aesthetic)
- **Routing:** React Router 7
- **Visualization:** Recharts
- **HTTP Client:** Axios

**Backend**
- **Framework:** FastAPI (Python 3.11+)
- **ORM:** SQLAlchemy + Alembic (Migrations)
- **Validation:** Pydantic v2
- **Security:** JWT Auth, Passlib (Bcrypt), OAuth 2.0

**AI & Database**
- **AI Engine:** OpenAI API (GPT-4o-mini)
- **Database:** PostgreSQL 14+ with `pgvector` for RAG capabilities (or SQLite for local dev)
- **Email:** SMTP for OTP and notifications

---

## 📁 Project Structure

```
SmartHealth/
├── backend/
│   ├── alembic/                # Database migration scripts
│   ├── app/health/
│   │   ├── api/                # FastAPI route handlers (BMI, Chat, OAuth, etc.)
│   │   ├── core/               # Config, security, dependencies & business logic
│   │   ├── models/             # SQLAlchemy database models
│   │   ├── schemas/            # Pydantic validation schemas
│   │   ├── services/           # Service layer (AI, Auth, RAG, User services)
│   │   ├── templates/          # HTML email templates
│   │   └── tests/              # Comprehensive Pytest suite
│   ├── main.py                 # FastAPI application entrypoint
│   ├── database.py             # DB engine, session & Base setup
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── auth/               # Auth UI, Context (AuthContext) & Services
│   │   ├── components/         # Reusable UI (Dashboard widgets, Chat bubbles)
│   │   ├── pages/              # Main pages (Home, Dashboard, Admin)
│   │   └── services/           # Centralized API client (Axios)
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** & **npm 10+**
- **Python 3.11 or 3.12**
- **PostgreSQL 14+** (Recommended) or **SQLite**
- **OpenAI API Key** (For chatbot features)
- **Google Cloud Console Credentials** (For OAuth login)

---

### Backend Setup

```bash
# 1. Navigate to backend and create virtual environment
cd backend
python -m venv venv

# 2. Activate the virtual environment
# On Windows:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
```

> **Note:** Edit `.env` with your specific credentials (see [Environment Variables](#-environment-variables) below).

```bash
# 5. Run database migrations
alembic upgrade head

# 6. Start the backend server
uvicorn main:app --reload
```

📖 **API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)

---

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

🌐 **Web Application:** [http://localhost:5173](http://localhost:5173)

---

## 🔑 Environment Variables

The application requires several environment variables to function correctly. Create a `.env` file in the `backend/` directory:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `SECRET_KEY` | JWT signing key | `openssl rand -hex 32` |
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-...` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`| Google OAuth Secret | `GOCSPX-...` |
| `SMTP_USER` | Email for sending OTPs | `your-email@gmail.com` |
| `SMTP_PASSWORD` | Email App Password | `xxxx xxxx xxxx xxxx` |

---

## 🐳 Docker Deployment

The easiest way to run the full stack (Frontend, Backend, and PostgreSQL) is via Docker Compose:

```bash
docker-compose up --build
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:8000](http://localhost:8000)

---

## 🧪 Testing

We use `pytest` for backend verification.

```bash
cd backend
# Ensure venv is active
pytest
```

Tests cover BMI calculations, Chatbot logic, Auth services, and User management.

---

## 💙 Inspiration

SmartHealth is designed to be **approachable** and **supportive**. Inspired by **Baymax**, we prioritize a soft color palette, friendly micro-interactions, and clear, empathetic AI communication. Our goal is to make health tracking feel like a conversation with a friend rather than a chore.

---

<div align="center">
  Built with ❤️ for a healthier world.
</div>