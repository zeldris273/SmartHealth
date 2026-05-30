from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from pathlib import Path

BACKEND_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    # --- CẤU HÌNH CHATBOT AI ---
    # AI_PROVIDER: openai
    AI_PROVIDER: str = "openai"
    OPENAI_API_KEY: Optional[str] = None
    OPEN_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4.1-mini"

    # --- CẤU HÌNH HỆ THỐNG GỬI OTP QUA GMAIL (NÂNG CẤP) ---
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str  # Pydantic tự động đọc từ biến SMTP_USER trong file .env
    SMTP_PASSWORD: str  # Mã 16 ký tự màu vàng của Google
    SMTP_FROM_NAME: str = "SmartHealth"
    
    # --- CẤU HÌNH GOOGLE OAUTH2 ---
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"

    # --- CẤU HÌNH COOKIE ---
    # False khi dev (HTTP), True khi deploy production (HTTPS)
    COOKIE_SECURE: bool = False
    # URL frontend để cấu hình CORS — tránh dùng wildcard * khi có credentials
    FRONTEND_URL: str = "http://localhost:5173"

    # --- CẤU HÌNH THỜI GIAN CHO OTP ---
    OTP_EXPIRE_MINUTES: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 60

    # --- CONFIGURATION DICT ---
    model_config = SettingsConfigDict(
        env_file=(".env", BACKEND_ENV_FILE),
        extra="ignore", 
        case_sensitive=True,
        env_file_encoding="utf-8",
        # Ưu tiên biến môi trường thực tế (từ docker-compose) hơn file .env
        env_priority="env" 
    )

settings = Settings()
