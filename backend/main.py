from fastapi import FastAPI
from app.health.api import bmi_router

app = FastAPI(
    title="SmartHealth API",
    description="API sức khoẻ thông minh – BMI, Cân nặng, Calories & Gợi ý sức khoẻ",
    version="1.0.0",
)

# ---- Đăng ký routers ----
app.include_router(bmi_router)


@app.get("/", tags=["Root"])
def root():
    return {"message": "SmartHealth API is running 🚀"}
