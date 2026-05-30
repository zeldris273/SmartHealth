from fastapi import HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.health.services.google_auth_service import GoogleAuthService
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

        OTPService.verify_otp(
            db=db,
            email=payload.email,
            otp_code=payload.otp,
            purpose="register",
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

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if user.auth_provider == "google":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account uses Google Login",
            )

        if not verify_password(password, user.password_hash):
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
    def forgot_password(
        db: Session,
        email: str,
        background_tasks: BackgroundTasks,
    ) -> dict:

        user = AuthService.get_user_by_email(db, email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email does not exist",
            )

        if user.auth_provider == "google":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account uses Google Login",
            )

        return OTPService.send_otp(
            db=db,
            email=email,
            purpose="forgot_password",
            background_tasks=background_tasks,
        )
    @staticmethod
    def verify_reset_otp(db: Session, email: str, otp_code: str) -> dict:
        # Gọi hàm verify_otp của Lạc để kiểm tra (nếu sai hoặc hết hạn hàm này tự quăng HTTPException rồi)
        OTPService.verify_otp(db=db, email=email, otp_code=otp_code, purpose="forgot_password")
        
        return {"message": "Xác thực OTP thành công. Vui lòng nhập mật khẩu mới."}

    @staticmethod
    def reset_password(
        db: Session,
        email: str,
        otp_code: str,
        new_password: str,
    ) -> dict:

        user = AuthService.get_user_by_email(db, email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if user.auth_provider == "google":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account uses Google Login",
            )

        OTPService.verify_otp(
            db=db,
            email=email,
            otp_code=otp_code,
            purpose="forgot_password",
        )

        user.password_hash = hash_password(new_password)

        db.commit()

        return {
            "message": "Password reset successfully"
        }
    @staticmethod
    def google_login(db: Session, google_token: str) -> dict:
        """
        Đăng nhập bằng Google token
        """
        # Xác thực token từ Google
        id_info = GoogleAuthService.verify_google_token(google_token)
        
        email = id_info.get("email")
        google_id = id_info.get("sub")
        full_name = id_info.get("name", "Google User")
        avatar_url = id_info.get("picture")
        
        # Kiểm tra user đã tồn tại
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Tạo user mới nếu chưa tồn tại
            user = User(
                email=email,
                full_name=full_name,
                google_id=google_id,
                avatar_url=avatar_url,
                auth_provider="google",
                password_hash=None  # Không cần mật khẩu cho Google login
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Cập nhật thông tin nếu user đã tồn tại
            user.google_id = google_id
            user.avatar_url = avatar_url
            user.auth_provider = "google"
            db.commit()
        
        # Tạo JWT token (sử dụng hàm helper `create_access_token` đã import)
        access_token = create_access_token(
            subject=str(user.id),
            role=user.role,
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }