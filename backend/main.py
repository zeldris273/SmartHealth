from fastapi import FastAPI, Depends
from core.security import hash_password, verify_password, create_access_token
from core.dependencies import require_role # Nhớ comment dòng import User bên trong file này nếu chưa có Model

app = FastAPI(title="SmartHealth API")

@app.get("/")
def root():
    return {"message": "Core security module ready"}

# Route test Hashing
@app.get("/test/hash")
def test_hashing(password: str):
    hashed = hash_password(password)
    return {
        "plain": password,
        "hashed": hashed,
        "is_correct": verify_password(password, hashed)
    }

# Route test JWT
@app.get("/test/token")
def test_token(user_id: str, role: str):
    token = create_access_token(subject=user_id, role=role)
    return {"access_token": token}

@app.get("/test/get-token")
def get_test_token(user_id: int = 1, role: str = "admin"):
    # Tạo token với subject là ID và role là admin
    token = create_access_token(subject=str(user_id), role=role)
    return {"access_token": token, "token_type": "bearer"}