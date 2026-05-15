from fastapi import FastAPI
from api.auth import router as auth_router
from db.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartHealth API",
    description="Hệ thống quản lý sức khỏe thông minh - Team SmartHealth",
    version="1.0.0"
)

app.include_router(auth_router)

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "SmartHealth API is running",
        "docs": "/docs",
        "status": "Identity API Ready"
    }