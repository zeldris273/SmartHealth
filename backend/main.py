from fastapi import FastAPI

from app.health.api.auth import router as auth_router
from app.health.api.users import router as users_router
from database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartHealth API")

app.include_router(auth_router)
app.include_router(users_router)


@app.get("/")
def root():
    return {"message": "RBAC module ready"}