from fastapi import APIRouter, Depends, BackgroundTasks, status
from sqlalchemy.orm import Session

from database import get_db  
from app.health.schemas.otp import (
    MessageResponse,
    SendOTPRequest,
    VerifyOTPRequest,
)
from app.health.services.otp_service import OTPService

router = APIRouter(
    prefix="/otp",
    tags=["OTP"],
)


@router.post(
    "/send",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Yêu cầu gửi mã OTP qua Email"
)
def send_otp(
    payload: SendOTPRequest,
    background_tasks: BackgroundTasks,  # Khai báo BackgroundTasks ở đây
    db: Session = Depends(get_db),
):
    # Truyền background_tasks xuống tầng Service để xử lý gửi mail ngầm
    return OTPService.send_otp(
        db=db,
        email=payload.email,
        purpose=payload.purpose,
        background_tasks=background_tasks
    )


@router.post(
    "/verify",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Xác thực mã OTP từ người dùng"
)
def verify_otp(
    payload: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    # Gọi service xác thực mã OTP
    OTPService.verify_otp(
        db=db,
        email=payload.email,
        otp_code=payload.otp_code,
        purpose=payload.purpose
    )
    
    # Nếu verify không ném lỗi ra (hợp lệ), trả về thông báo thành công cho FE
    return {"message": "Mã OTP hợp lệ. Xác thực thành công!"}