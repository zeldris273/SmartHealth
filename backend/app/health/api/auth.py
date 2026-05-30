from fastapi import APIRouter, Depends, status, BackgroundTasks, Response, Request, HTTPException
from sqlalchemy.orm import Session

from app.health.core.config import settings
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
)
from app.health.services.auth_service import AuthService


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

# Thời gian sống của refresh token cookie (giây)
REFRESH_TOKEN_COOKIE_MAX_AGE = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Helper: ghi refresh token vào HttpOnly cookie."""
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,                      # JS không thể đọc được
        secure=settings.COOKIE_SECURE,      # True trên HTTPS (production)
        samesite="lax",                     # Bảo vệ CSRF cơ bản
        max_age=REFRESH_TOKEN_COOKIE_MAX_AGE,
        path="/auth",                       # Chỉ gửi cookie khi gọi /auth/*
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Helper: xóa refresh token cookie."""
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        path="/auth",
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
    response: Response,
    db: Session = Depends(get_db),
):
    data = AuthService.login(db, payload.email, payload.password)
    _set_refresh_cookie(response, data["refresh_token"])
    # Chỉ trả access_token trong JSON — refresh_token ở trong cookie
    return {
        "access_token": data["access_token"],
        "token_type": data["token_type"],
    }


@router.post(
    "/refresh",
    response_model=Token,
)
def refresh(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Đọc refresh token từ HttpOnly cookie (không cần body).
    Trả access token mới + cập nhật cookie refresh token mới (rotation).
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )

    data = AuthService.refresh_token(db, refresh_token)
    _set_refresh_cookie(response, data["refresh_token"])
    return {
        "access_token": data["access_token"],
        "token_type": data["token_type"],
    }


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
)
def logout(response: Response):
    """Xóa refresh token cookie — đăng xuất an toàn."""
    _clear_refresh_cookie(response)
    return {"message": "Logged out successfully"}


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


@router.post(
    "/google-login",
    response_model=Token,
)
def google_login(
    payload: dict,
    response: Response,
    db: Session = Depends(get_db),
):
    """Đăng nhập bằng Google token, set refresh cookie tương tự login thường."""
    data = AuthService.google_login(db, payload.get("token", ""))
    _set_refresh_cookie(response, data["refresh_token"])
    return {
        "access_token": data["access_token"],
        "token_type": data["token_type"],
    }
