# Chatbot Gemini Backend - SmartHealth

## Các file đã thêm/sửa

- `app/health/api/chat.py` - API route `POST /health/chat`
- `app/health/schemas/chat.py` - request/response schema cho chatbot
- `app/health/services/chat_service.py` - logic tạo prompt và gọi Gemini API
- `app/health/tests/test_chatbot.py` - unit test cho chatbot
- `main.py` - đăng ký `chat_router`
- `app/health/api/__init__.py` và `app/health/schemas/__init__.py` - export module mới

## Cấu hình API key

Trong thư mục `backend`, tạo file `.env` từ `.env.example`:

```bash
copy .env.example .env
```

Sau đó sửa dòng:

```env
GEMINI_API_KEY=your-gemini-api-key-here
```

thành API key thật.

## Cài thư viện

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Nếu máy chưa có pytest để chạy test, cài thêm:

```bash
pip install pytest
```

## Chạy backend

```bash
uvicorn main:app --reload
```

Mở Swagger UI:

```text
http://127.0.0.1:8000/docs
```

Endpoint chatbot:

```text
POST /health/chat
```

Body mẫu:

```json
{
  "message": "Tôi bị đau đầu và hơi sốt thì nên làm gì?",
  "bmi": 23.5,
  "history": []
}
```

Response mẫu:

```json
{
  "reply": "Bạn nên nghỉ ngơi, uống đủ nước..."
}
```

## Chạy test chatbot

```bash
pytest app/health/tests/test_chatbot.py -v
```

## Lưu ý

- Chatbot chỉ hỗ trợ nội dung liên quan đến sức khỏe/y tế.
- Nếu câu hỏi ngoài lĩnh vực sức khỏe, API sẽ trả về câu từ chối cố định.
- Nếu chưa cấu hình `GEMINI_API_KEY`, API sẽ trả lỗi `503`.
