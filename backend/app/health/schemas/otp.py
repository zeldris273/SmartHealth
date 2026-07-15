from typing import Literal
from pydantic import BaseModel, EmailStr, Field


class SendOTPRequest(BaseModel):
    email: EmailStr
    purpose: Literal["register", "forgot_password"]


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    # Ép buộc Frontend phải gửi đúng chuỗi 6 ký tự, không thừa không thiếu
    otp_code: str = Field(..., min_length=6, max_length=6, description="Mã OTP gồm 6 chữ số")
    purpose: Literal["register", "forgot_password"]


class MessageResponse(BaseModel):
    message: str