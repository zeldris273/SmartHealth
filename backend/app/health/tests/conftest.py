import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[3]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

# Giá trị test để import config mà không cần tạo file .env thật.
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_smarthealth.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("SMTP_USER", "test@example.com")
os.environ.setdefault("SMTP_PASSWORD", "test-password")
os.environ.setdefault("AI_PROVIDER", "openai")
os.environ.setdefault("OPENAI_MODEL", "gpt-4.1-mini")
