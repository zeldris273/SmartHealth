from fastapi import FastAPI

app = FastAPI(title="SmartHealth API")

@app.get("/")
def root():
    return {"message": "SmartHealth API is running"}