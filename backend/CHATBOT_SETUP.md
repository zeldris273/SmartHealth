# SmartHealth Chatbot Backend

## Tính năng đã bổ sung

- Chọn AI provider bằng `.env`: `gemini` hoặc `openai`.
- Chọn model bằng `.env`, không cần sửa code.
- `POST /health/chat` trả lời câu hỏi sức khỏe.
- Nếu người dùng gửi Bearer token hợp lệ:
  - chatbot tự đọc BMI mới nhất trong bảng `bmi_records` nếu `use_saved_bmi=true`.
  - backend lưu lịch sử chat vào bảng `chat_messages` nếu `save_history=true`.
- `GET /health/chat/history` lấy lịch sử chat của người dùng hiện tại.
- Có unit test chatbot trong `app/health/tests/test_chatbot.py`.

## Cấu hình `.env`

Copy file mẫu:

```bash
copy .env.example .env
```

### Dùng Gemini

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash
```

Muốn đổi sang Pro:

```env
GEMINI_MODEL=gemini-2.5-pro
```

### Dùng OpenAI

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4.1-mini
```

Sau khi sửa `.env`, chạy lại backend.

## Cài thư viện

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Chạy backend

```bash
uvicorn main:app --reload
```

Mở Swagger:

```text
http://127.0.0.1:8000/docs
```

## Gọi chatbot không đăng nhập

```json
POST /health/chat
{
  "message": "Tôi muốn giảm cân an toàn thì nên làm gì?",
  "bmi": 27.5
}
```

Trường hợp này chatbot dùng BMI do frontend truyền lên, nhưng không lưu lịch sử.

## Gọi chatbot có đăng nhập

Gửi kèm header:

```text
Authorization: Bearer <access_token>
```

Body:

```json
{
  "message": "Dựa trên BMI của tôi, tôi nên ăn uống thế nào?",
  "use_saved_bmi": true,
  "save_history": true
}
```

Nếu user đã từng dùng `/health/bmi/save`, chatbot sẽ tự lấy BMI mới nhất trong database.

Response có dạng:

```json
{
  "reply": "...",
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "session_id": "...",
  "bmi": 27.5,
  "saved": true
}
```

## Lấy lịch sử chat

```text
GET /health/chat/history
Authorization: Bearer <access_token>
```

Lọc theo phiên chat:

```text
GET /health/chat/history?session_id=<session_id>
```

## Database

Đã thêm model:

```text
app/health/models/chat.py
```

Bảng mới:

```text
chat_messages
```

Nếu chạy app trực tiếp, `Base.metadata.create_all(bind=engine)` trong `main.py` có thể tự tạo bảng.

Nếu nhóm dùng Alembic, chạy:

```bash
alembic upgrade head
```

## Chạy test chatbot

```bash
pytest app/health/tests/test_chatbot.py -v
```
