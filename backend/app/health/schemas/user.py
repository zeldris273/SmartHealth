from datetime import date
from typing import Literal
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
# Import các hàm validate dùng chung từ tầng core của Lạc
from app.health.core.security_rules import validate_email_domain, validate_strong_password


# ==========================================
# 1. SCHEMAS CHO LUỒNG ĐĂNG KÝ & ĐĂNG NHẬP
# ==========================================
class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., description="Email hệ thống (Gmail hoặc email HUTECH)")
    password: str = Field(..., min_length=8, max_length=100)

    @field_validator('email')
    @classmethod
    def check_email(cls, v: str) -> str:
        return validate_email_domain(v)

    @field_validator('password')
    @classmethod
    def check_password(cls, v: str) -> str:
        return validate_strong_password(v)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ==========================================
# 2. SCHEMAS CHO LUỒNG CẬP NHẬT THÔNG TIN
# ==========================================
class RoleUpdate(BaseModel):
    role: Literal["user", "admin"]


# ---- THÊM MỚI SCHEMA CẬP NHẬT PROFILE TẠI ĐÂY ----
class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=100)
    phone_number: str | None = Field(None, min_length=9, max_length=15)
    gender: Literal["male", "female", "other"] | None = None
    date_of_birth: date | None = None
    national_id: str | None = Field(None, min_length=9, max_length=20)
    address: str | None = Field(None, max_length=255)


# ==========================================
# 3. SCHEMA ĐÁP TRẢ DỮ LIỆU (RESPONSE)
# ==========================================
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    # Bổ sung thêm các trường thông tin mới để API trả về đầy đủ cho FE hiển thị
    phone_number: str | None = None
    gender: str | None = None
    date_of_birth: date | None = None
    national_id: str | None = None
    address: str | None = None

    # Thay class Config cũ bằng model_config chuẩn Pydantic v2 mới nhất
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 4. SCHEMAS CHO LUỒNG QUÊN MẬT KHẨU (NEW)
# ==========================================
class ForgotPasswordRequest(BaseModel):
    """Nhận email yêu cầu cấp lại mật khẩu"""
    email: EmailStr

    @field_validator('email')
    @classmethod
    def check_email(cls, v: str) -> str:
        return validate_email_domain(v)


class VerifyResetOTPRequest(BaseModel):
    """Xác thực mã OTP gửi qua Email xem có khớp không"""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6, description="Mã OTP gồm 6 chữ số")


class ResetPasswordRequest(BaseModel):
    """Tiến hành đổi mật khẩu mới sau khi xác thực OTP thành công"""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=100, description="Mật khẩu mới")

    @field_validator('new_password')
    @classmethod
    def check_password(cls, v: str) -> str:
        # Ép mật khẩu mới cũng phải thỏa mãn quy tắc bảo mật mạnh của dự án
        return validate_strong_password(v)