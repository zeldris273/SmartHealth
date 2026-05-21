from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # --- CẤU HÌNH CŨ CỦA LẠC ---
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    # --- CẤU HÌNH CHATBOT AI ---
    # AI_PROVIDER: gemini hoặc openai
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4.1-mini"

    # --- CẤU HÌNH HỆ THỐNG GỬI OTP QUA GMAIL (NÂNG CẤP) ---
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str  # Pydantic tự động đọc từ biến SMTP_USER trong file .env
    SMTP_PASSWORD: str  # Mã 16 ký tự màu vàng của Google
    SMTP_FROM_NAME: str = "SmartHealth"
    
    # --- CẤU HÌNH THỜI GIAN CHO OTP ---
    OTP_EXPIRE_MINUTES: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 60

    # --- CONFIGURATION DICT CỦA LẠC ---
    model_config = SettingsConfigDict(
        env_file=".env", 
        extra="ignore", 
        case_sensitive=True
    )

settings = Settings()