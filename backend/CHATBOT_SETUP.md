# Hướng dẫn chạy chatbot Gemini API

## 1. Cài môi trường backend

Mở terminal tại thư mục `backend`:

```bash
cd backend
python -m venv venv
```

Kích hoạt môi trường ảo trên Windows PowerShell:

```bash
.\venv\Scripts\Activate.ps1
```

Nếu PowerShell chặn script, chạy:

```bash
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

Cài thư viện:

```bash
pip install -r requirements.txt
```

## 2. Tạo file `.env`

Copy file `.env.example` thành `.env`:

```bash
copy .env.example .env
```

Mở file `.env` và sửa:

```env
GEMINI_API_KEY=api_key_cua_ban
```

Nếu máy chưa cài PostgreSQL, để chạy thử nhanh có thể đổi database sang SQLite:

```env
DATABASE_URL=sqlite:///./smarthealth.db
```

## 3. Chạy backend

```bash
uvicorn main:app --reload
```

Mở Swagger UI:

```text
http://127.0.0.1:8000/docs
```

API chatbot nằm ở:

```text
POST /health/chat
```

Body mẫu:

```json
{
  "message": "Tôi cao 170cm nặng 75kg, nên giảm cân thế nào?",
  "bmi": 25.95,
  "history": []
}
```

## 4. Test chatbot

Trong thư mục `backend`, chạy:

```bash
pytest app/health/tests/test_chatbot.py -v
```

Test này không gọi Gemini thật, mà mock API để kiểm tra route và prompt.

## Các file đã thêm/sửa

Đã thêm:

- `app/health/api/chat.py`
- `app/health/schemas/chat.py`
- `app/health/services/chat_service.py`
- `app/health/tests/test_chatbot.py`

Đã sửa:

- `main.py`
- `app/health/schemas/__init__.py`
- `app/health/api/__init__.py`
- `app/health/core/config.py`
