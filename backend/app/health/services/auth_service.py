from fastapi import HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.health.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.health.models.user import User
from app.health.schemas.user import UserRegister
# Import OTPService để giao toàn bộ luồng xử lý OTP cho nó gánh
from app.health.services.otp_service import OTPService 


class AuthService:
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def register(db: Session, payload: UserRegister) -> User:
        existing_user = AuthService.get_user_by_email(db, payload.email)

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )

        user = User(
            full_name=payload.full_name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role="user",
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def login(db: Session, email: str, password: str) -> dict:
        user = AuthService.get_user_by_email(db, email)

        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        access_token = create_access_token(
            subject=str(user.id),
            role=user.role,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }

    # =================================================================
    # LUỒNG QUÊN MẬT KHẨU (FORGOT / RESET PASSWORD)
    # =================================================================

    @staticmethod
    def forgot_password(db: Session, email: str, background_tasks: BackgroundTasks) -> dict:
        # 1. Kiểm tra xem email có tồn tại trên hệ thống không
        user = AuthService.get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email này không tồn tại trên hệ thống.",
            )

        # 2. Ủy quyền hoàn toàn cho OTPService: Tự check cooldown spam, tự sinh mã, lưu DB và bắn mail ngầm
        return OTPService.send_otp(
            db=db,
            email=email,
            purpose="forgot_password",
            background_tasks=background_tasks
        )

    @staticmethod
    def verify_reset_otp(db: Session, email: str, otp_code: str) -> dict:
        # Gọi hàm verify_otp của Lạc để kiểm tra (nếu sai hoặc hết hạn hàm này tự quăng HTTPException rồi)
        OTPService.verify_otp(db=db, email=email, otp_code=otp_code, purpose="forgot_password")
        
        return {"message": "Xác thực OTP thành công. Vui lòng nhập mật khẩu mới."}

    @staticmethod
    def reset_password(db: Session, email: str, otp_code: str, new_password: str) -> dict:
        # 1. Tìm thực thể User dựa vào email để tiến hành đổi pass
        user = AuthService.get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Người dùng không tồn tại.",
            )

        # 2. Xác thực OTP lần cuối trước khi cho phép đổi mật khẩu
        # Hàm verify_otp của Lạc sẽ tự động cập nhật `is_used = True` dưới DB luôn, cực kỳ an toàn
        OTPService.verify_otp(db=db, email=email, otp_code=otp_code, purpose="forgot_password")

        # 3. Băm mật khẩu mới và cập nhật vào DB
        user.password_hash = hash_password(new_password)
        db.commit()

        return {"message": "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới."}