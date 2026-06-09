import random
import logging
import smtplib
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, BackgroundTasks

from app.health.core.config import settings
from app.health.models.email_otp import EmailOTP
from app.health.services.email_service import EmailService

logger = logging.getLogger(__name__)

class OTPService:
    @staticmethod
    def generate_otp() -> str:
        """Sinh mã OTP ngẫu nhiên gồm 6 chữ số"""
        return f"{random.randint(100000, 999999)}"

    @staticmethod
    def send_otp(
        db: Session,
        email: str,
        purpose: str,
        background_tasks: BackgroundTasks | None = None
    ) -> dict:
        # 1. KIỂM TRA COOLDOWN (Chặn spam gửi lại mã quá nhanh)
        last_otp = (
            db.query(EmailOTP)
            .filter(EmailOTP.email == email, EmailOTP.purpose == purpose)
            .order_by(EmailOTP.id.desc())
            .first()
        )

        if last_otp:
            # Tính thời gian đã trôi qua kể từ lúc tạo OTP gần nhất
            now = datetime.now(timezone.utc)
            time_passed = now - last_otp.created_at
            
            if time_passed.total_seconds() < settings.OTP_RESEND_COOLDOWN_SECONDS:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Vui lòng đợi {settings.OTP_RESEND_COOLDOWN_SECONDS} giây trước khi yêu cầu mã OTP mới."
                )

        # 2. SINH VÀ LƯU OTP MỚI
        otp_code = OTPService.generate_otp()

        otp = EmailOTP(
            email=email,
            otp_code=otp_code,
            purpose=purpose,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
        )

        db.add(otp)
        db.commit()

        try:
            if settings.SMTP_USER == "placeholder@example.com":
                # Chế độ thử nghiệm cục bộ: in trực tiếp ra console của Uvicorn để dev copy
                print("\n" + "="*60)
                print(f"🔥 [DEVELOPER MODE] MÃ OTP CỦA BẠN LÀ: {otp_code} 🔥")
                print(f"👉 Email nhận: {email} | Mục đích: {purpose}")
                print("="*60 + "\n")
            else:
                EmailService.send_otp_email(email, otp_code)
        except Exception as exc:
            # Nếu gửi mail thật lỗi nhưng ta muốn hỗ trợ dev test nhanh mà không bị lỗi 502 chặn lại
            print("\n" + "="*60)
            print(f"⚠️ [SMTP ERROR] Gửi email thất bại: {str(exc)}")
            print(f"🔥 MÃ OTP ĐỂ TEST LÀ: {otp_code} 🔥")
            print(f"👉 Email nhận: {email} | Mục đích: {purpose}")
            print("="*60 + "\n")
            logger.exception("Gửi email thất bại nhưng giữ lại OTP để test cục bộ.")

        return {"message": "Mã OTP đã được tạo thành công (Kiểm tra terminal backend để xem mã)."}

    @staticmethod
    def verify_otp(
        db: Session,
        email: str,
        otp_code: str,
        purpose: str,
    ) -> bool:
        # Lấy mã OTP mới nhất chưa sử dụng của email này
        otp = (
            db.query(EmailOTP)
            .filter(
                EmailOTP.email == email,
                EmailOTP.otp_code == otp_code,
                EmailOTP.purpose == purpose,
                EmailOTP.is_used.is_(False),
            )
            .order_by(EmailOTP.id.desc())
            .first()
        )

        if not otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã OTP không chính xác hoặc đã được sử dụng.",
            )

        # Kiểm tra thời hạn hiệu lực
        if otp.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã OTP đã hết hạn sử dụng.",
            )

        # Hợp lệ -> Đánh dấu đã dùng và lưu lại
        otp.is_used = True
        db.commit()

        return True
