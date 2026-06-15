from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
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

from database import Base, engine

if engine.dialect.name == "postgresql":
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartHealth API",
    description="API sức khoẻ thông minh – Auth, User, BMI, Cân nặng, Calories & Gợi ý sức khoẻ",
    version="1.0.0",
)

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


@app.get("/")
def root():
    return {"message": "SmartHealth API is running"} 

@app.websocket("/test-ws")
async def test_websocket(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Hello WebSocket!")
    await websocket.close()
