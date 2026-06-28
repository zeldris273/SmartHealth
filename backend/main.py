import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

class WebSocketOriginMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.scope.get("type") == "websocket":
            # Force the origin to be accepted for WebSockets
            # In a real production environment, you should validate the origin
            pass 
        return await call_next(request)
from sqlalchemy import text

from app.health.api.auth import router as auth_router
from app.health.api.google_oauth import router as google_oauth_router
from app.health.api.users import router as users_router
from app.health.api.bmi import router as bmi_router
from app.health.api.calories import router as calories_router
from app.health.api.health_tips import router as health_tips_router
from app.health.api.chat import router as chat_router
from app.health.api.documents import router as documents_router
from app.health.api.otp import router as otp_router
from app.health.api.support import router as support_router
from app.health.api.admin_stats import router as admin_stats_router

from database import Base, engine, SessionLocal
from app.health.services.reminder_service import ReminderService

if engine.dialect.name == "postgresql":
    with engine.begin() as connection:
        try:
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        except Exception as e:
            print(f"Warning: Could not create extension vector: {e}")
        
        # Alter avatar_url column to TEXT type to handle large base64 images
        try:
            connection.execute(text("ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT"))
        except Exception as e:
            print(f"Warning: Could not alter avatar_url column: {e}")
        
        # Add missing columns one by one, with IF NOT EXISTS
        missing_columns = [
            ("wrist_circumference", "DOUBLE PRECISION"),
            ("ankle_circumference", "DOUBLE PRECISION"),
            ("underlying_diseases", "TEXT"),
            ("food_allergies", "TEXT"),
            ("activity_level", "VARCHAR(50)"),
            ("other_diseases", "VARCHAR(255)"),
            ("other_allergies", "VARCHAR(255)"),
        ]
        
        for col_name, col_type in missing_columns:
            try:
                connection.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                print(f"Added column {col_name} successfully")
            except Exception as e:
                print(f"Warning: Could not add column {col_name}: {e}")
        
        # Add support_tickets columns
        try:
            connection.execute(text("ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS last_admin_read_message_id INTEGER"))
            print("Added column last_admin_read_message_id to support_tickets successfully")
        except Exception as e:
            print(f"Warning: Could not add last_admin_read_message_id: {e}")
else:
    # For SQLite
    with engine.begin() as connection:
        # Check existing columns for users
        result = connection.execute(text("PRAGMA table_info(users)"))
        existing_columns = [row[1] for row in result.fetchall()]
        print(f"Existing users columns: {existing_columns}")
        
        # List of columns to add
        missing_columns = [
            ("wrist_circumference", "REAL"),
            ("ankle_circumference", "REAL"),
            ("underlying_diseases", "TEXT"),
            ("food_allergies", "TEXT"),
            ("activity_level", "VARCHAR(50)"),
            ("other_diseases", "VARCHAR(255)"),
            ("other_allergies", "VARCHAR(255)"),
        ]
        
        for col_name, col_type in missing_columns:
            if col_name not in existing_columns:
                try:
                    connection.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                    print(f"Added column {col_name} successfully")
                except Exception as e:
                    print(f"Warning: Could not add column {col_name}: {e}")
        
        # Check support_tickets columns
        result = connection.execute(text("PRAGMA table_info(support_tickets)"))
        existing_support_columns = [row[1] for row in result.fetchall()]
        print(f"Existing support_tickets columns: {existing_support_columns}")
        
        if "last_admin_read_message_id" not in existing_support_columns:
            try:
                connection.execute(text("ALTER TABLE support_tickets ADD COLUMN last_admin_read_message_id INTEGER"))
                print("Added column last_admin_read_message_id to support_tickets successfully")
            except Exception as e:
                print(f"Warning: Could not add last_admin_read_message_id to support_tickets: {e}")

Base.metadata.create_all(bind=engine)

async def bmi_reminder_task():
    """Background task to process BMI reminders every hour."""
    while True:
        try:
            print("Running BMI Reminder background job...")
            with SessionLocal() as db:
                ReminderService.process_bmi_reminders(db)
        except Exception as e:
            print(f"Error in BMI Reminder background task: {e}")
        
        # Wait for 1 hour (3600 seconds)
        await asyncio.sleep(3600)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background task
    task = asyncio.create_task(bmi_reminder_task())
    yield
    # Cancel task on shutdown
    task.cancel()

app = FastAPI(
    title="SmartHealth API",
    description="API sức khoẻ thông minh – Auth, User, BMI, Cân nặng, Calories & Gợi ý sức khoẻ",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(WebSocketOriginMiddleware)

# ---- Cấu hình CORS để frontend có thể gọi API
# Không dùng allow_origins=["*"] khi có allow_credentials=True vì trình duyệt sẽ block
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://127.0.0.1:5173",
        "http://localhost:3000",   # Fallback nếu dùng port 3000
        "http://localhost:80",     # Docker frontend
        "http://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Đăng ký routers ----
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(bmi_router)
app.include_router(calories_router)
app.include_router(health_tips_router)
app.include_router(chat_router)
app.include_router(documents_router)
app.include_router(otp_router)
app.include_router(google_oauth_router)
app.include_router(support_router)
app.include_router(admin_stats_router)


@app.get("/")
def root():
    return {"message": "SmartHealth API is running"} 

@app.websocket("/test-ws")
async def test_websocket(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Hello WebSocket!")
    await websocket.close()
