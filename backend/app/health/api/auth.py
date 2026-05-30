from fastapi import APIRouter, Depends, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.health.core.dependencies import get_current_user
from database import get_db
from app.health.models.user import User
from app.health.schemas.user import (
    Token,
    UserLogin,
    UserRegister,
    UserResponse,
    ForgotPasswordRequest, 
    VerifyResetOTPRequest,  
    ResetPasswordRequest,
    RefreshTokenRequest,
)
from app.health.services.auth_service import AuthService
from app.health.services.google_auth_service import GoogleAuthService
from app.health.schemas.user import GoogleLoginRequest


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: UserRegister,
    db: Session = Depends(get_db),
):
    return AuthService.register(db, payload)


@router.post(
    "/login",
    response_model=Token,
)
def login(
    payload: UserLogin,
    db: Session = Depends(get_db),
):
    return AuthService.login(
        db,
        payload.email,
        payload.password,
    )


@router.post(
    "/refresh",
    response_model=Token,
)
def refresh(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    return AuthService.refresh_token(db, payload.refresh_token)


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user
# =================================================================
# LUỒNG QUÊN MẬT KHẨU (FORGOT / RESET PASSWORD)
# =================================================================

@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
)
def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Bước 1: Nhận email từ người dùng, kiểm tra hệ thống và gửi mã OTP qua Gmail.
    """
    return AuthService.forgot_password(db, payload.email, background_tasks)


@router.post(
    "/verify-reset-otp",
    status_code=status.HTTP_200_OK,
)
def verify_reset_otp(
    payload: VerifyResetOTPRequest,
    db: Session = Depends(get_db),
):
    """
    Bước 2: Frontend gửi OTP lên để kiểm tra xem hợp lệ và còn hạn hay không.
    """
    return AuthService.verify_reset_otp(db, payload.email, payload.otp_code)


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Bước 3: Xác thực lại mã OTP một lần nữa và tiến hành cập nhật mật khẩu mới vào DB.
    """
    return AuthService.reset_password(
        db, 
        payload.email, 
        payload.otp_code, 
        payload.new_password
    )

@router.post("/google-login", response_model=Token)
def google_login(
    payload: GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Nhận Google ID Token từ frontend, xác thực và trả về JWT access token
    """
    return AuthService.google_login(db, payload.token)
