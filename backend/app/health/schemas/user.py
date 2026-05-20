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