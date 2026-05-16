from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Literal
# Import các hàm validate dùng chung từ tầng core
from app.health.core.security_rules import validate_email_domain, validate_strong_password

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., description="Email hệ thống (Gmail hoặc email HUTECH)")
    password: str = Field(..., min_length=8, max_length=100)

    # Đăng ký hàm kiểm tra tập trung cho email
    @field_validator('email')
    @classmethod
    def check_email(cls, v: str) -> str:
        return validate_email_domain(v)

    # Đăng ký hàm kiểm tra tập trung cho password
    @field_validator('password')
    @classmethod
    def check_password(cls, v: str) -> str:
        return validate_strong_password(v)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class RoleUpdate(BaseModel):
    role: Literal["user", "admin"]