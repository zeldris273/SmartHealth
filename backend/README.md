# ⚙️ SmartHealth Backend

The backend for SmartHealth is a robust, high-performance API built with **FastAPI**. It handles authentication, health data processing, and integrates with AI services for the health companion features.

## 🛠 Tech Stack

- **Framework:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL (Production) / SQLite (Local)
- **ORM:** SQLAlchemy
- **Migrations:** Alembic
- **Validation:** Pydantic v2
- **Authentication:** JWT (JSON Web Tokens) & OAuth 2.0 (Google)
- **AI:** OpenAI GPT-4o-mini
- **Task/RAG:** pgvector for vector search

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **PostgreSQL** (with `pgvector` extension if using RAG)
- **Virtualenv** (recommended)

### Installation

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    # Windows:
    .\venv\Scripts\Activate.ps1
    # macOS/Linux:
    source venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure environment variables:**
    Copy `.env.example` to `.env` and fill in your credentials.
    ```bash
    cp .env.example .env
    ```

5.  **Run Database Migrations:**
    ```bash
    alembic upgrade head
    ```

6.  **Start the server:**
    ```bash
    uvicorn main:app --reload
    ```

The API will be running at [http://localhost:8000](http://localhost:8000).
Interactive documentation (Swagger) is available at [/docs](http://localhost:8000/docs).

## 📁 Project Structure

- `app/health/api/`: API endpoints organized by domain (auth, bmi, chat, etc.).
- `app/health/core/`: Centralized configuration, security rules, and dependencies.
- `app/health/models/`: SQLAlchemy database models.
- `app/health/schemas/`: Pydantic models for request/response validation.
- `app/health/services/`: Business logic layer (AI chat, user management, email service).
- `app/health/tests/`: Pytest suite for automated testing.

## 🧪 Testing

Run the test suite using `pytest`:
```bash
pytest
```
For coverage report:
```bash
pytest --cov=app
```

## 🔄 Migrations

When you modify the database models, generate a new migration:
```bash
alembic revision --autogenerate -m "description of changes"
alembic upgrade head
```
