from fastapi import FastAPI

from api.auth import router as auth_router
from api.users import router as users_router
from db.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartHealth API")

app.include_router(auth_router)
app.include_router(users_router)


@app.get("/")
def root():
    return {"message": "RBAC module ready"}