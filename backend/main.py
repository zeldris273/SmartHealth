from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.health.api.auth import router as auth_router
from app.health.api.users import router as users_router
from app.health.api.bmi import router as bmi_router
from database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartHealth API",
    description="API sức khoẻ thông minh – Auth, User, BMI, Cân nặng, Calories & Gợi ý sức khoẻ",
    version="1.0.0",
)

# ---- Cấu hình CORS để frontend có thể gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Sau này thay bằng domain của frontend (vd: ["http://localhost:5173"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Đăng ký routers ----
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(bmi_router)


@app.get("/")
def root():
    return {"message": "RBAC module ready"}