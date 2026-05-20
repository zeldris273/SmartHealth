# Hệ thống Xác thực OTP & Quản lý Hồ sơ Backend - SmartHealth

## Các file đã thêm/sửa trong hệ thống

- `app/health/models/user.py` - Cấu trúc bảng `users` (thêm các cột profile mới)
- `app/health/models/otp.py` - Cấu trúc bảng `email_otps` (quản lý mã OTP gửi qua mail)
- `app/health/schemas/user.py` - Request/Response schema dữ liệu đầu vào và đầu ra cho User (Pydantic v2)
- `app/health/services/user_service.py` - Logic xử lý kiểm tra trùng lặp SĐT/CCCD và cập nhật profile tự động
- `app/health/api/user.py` - API route `GET /users/me`, `PATCH /users/me`, `GET /users/{user_id}`, `PATCH /users/{user_id}/role`
- `main.py` - Đăng ký `users_router` và kích hoạt ứng dụng tổng tập trung
- `alembic/env.py` - Cấu hình nạp tập trung toàn bộ Model để quản lý nâng cấp Database

---

## Cấu hình Biến môi trường (.env)

Trong thư mục `backend`, mở file `.env` và cấu hình đầy đủ các thông số kết nối Database và tài khoản SMTP gửi mail:

```env
# Cấu hình kết nối PostgreSQL
DATABASE_URL=postgresql://postgres:mat_khau_cua_lac@localhost:5432/smarthealth

# Cấu hình dịch vụ SMTP Gmail để gửi mã OTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=smarthealth.contact204@gmail.com
SMTP_PASSWORD=abcdxyzefghiklmn # Mật khẩu ứng dụng 16 ký tự viết liền

cd backend
# Khởi tạo môi trường cấu hình Alembic (nếu là lần đầu setup)
alembic init alembic

# Tạo kịch bản cập nhật tự động dựa trên sự thay đổi của Model
alembic revision --autogenerate -m "add profile fields to user table"

# Thực thi đẩy cấu trúc mới xuống Database
alembic upgrade head

cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload

[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)


{
  "full_name": "Vũ Thiên Lạc (Senior)",
  "phone_number": "0987654321",
  "gender": "male",
  "date_of_birth": "2004-01-01",
  "national_id": "123456789012",
  "address": "Bình Thạnh, TP.HCM"
}