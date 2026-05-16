"""
bmi.py  –  Health / BMI endpoints
=====================================

Prefix: /health
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date

from database import get_db
from app.health.core.dependencies import get_current_user
from app.health.models.user import User
from app.health.schemas import (
    BMICalculateRequest,
    BMICalculateResponse,
    BMIRecordResponse,
    BMIHealthTip,
    WeightHistoryResponse,
    WeightHistoryItem,
)
from app.health.models import BMIRecord
from app.health.core import process_bmi

router = APIRouter(prefix="/health", tags=["Health – BMI"])


# --------------------------------------------------------------------------- #
#  POST /health/bmi  –  Tính BMI (không lưu DB, dùng khi chưa đăng nhập)    #
# --------------------------------------------------------------------------- #

@router.post(
    "/bmi",
    response_model=BMICalculateResponse,
    summary="Tính chỉ số BMI",
    description=(
        "Tính chỉ số BMI từ cân nặng và chiều cao theo công thức WHO. "
        "Trả về phân loại, khoảng cân nặng lý tưởng và gợi ý sức khoẻ. "
        "Không yêu cầu đăng nhập."
    ),
    status_code=status.HTTP_200_OK,
)
def calculate_bmi(body: BMICalculateRequest):
    """
    Tính BMI và trả về kết quả kèm gợi ý sức khoẻ.
    Không yêu cầu xác thực, không lưu vào cơ sở dữ liệu.
    """
    try:
        result = process_bmi(
            weight_kg=body.weight_kg,
            height_cm=body.height_cm,
            age=body.age,
            gender=body.gender,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    return BMICalculateResponse(
        weight_kg=result.weight_kg,
        height_cm=result.height_cm,
        bmi_value=result.bmi_value,
        bmi_category=result.bmi_category,
        bmi_category_vi=result.bmi_category_vi,
        healthy_bmi_range=result.healthy_bmi_range,
        healthy_weight_range_kg=result.healthy_weight_range_kg,
        tips=[BMIHealthTip(**t) for t in result.tips],
    )


# --------------------------------------------------------------------------- #
#  POST /health/bmi/save  –  Tính & lưu kết quả vào DB (yêu cầu đăng nhập)   #
# --------------------------------------------------------------------------- #

@router.post(
    "/bmi/save",
    response_model=BMIRecordResponse,
    summary="Tính và lưu chỉ số BMI",
    description=(
        "Tính BMI rồi lưu kết quả vào cơ sở dữ liệu. "
        "Nếu đã có bản ghi trong ngày hôm nay, sẽ ghi đè thay vì tạo mới. "
        "Yêu cầu đăng nhập."
    ),
    status_code=status.HTTP_200_OK,
)
def calculate_and_save_bmi(
    body: BMICalculateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Tính BMI và lưu bản ghi vào bảng `bmi_records`.
    Nếu đã có bản ghi trong ngày hôm nay, sẽ ghi đè thay vì tạo mới.
    Yêu cầu đăng nhập.
    """
    try:
        result = process_bmi(
            weight_kg=body.weight_kg,
            height_cm=body.height_cm,
            age=body.age,
            gender=body.gender,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    # Kiểm tra xem đã có bản ghi nào của người dùng này trong ngày hôm nay chưa
    today = date.today()
    existing_record = (
        db.query(BMIRecord)
        .filter(BMIRecord.user_id == current_user.id)
        .filter(func.date(BMIRecord.created_at) == today)
        .first()
    )

    if existing_record:
        # Nếu đã có, cập nhật bản ghi hiện tại
        existing_record.weight_kg = result.weight_kg
        existing_record.height_cm = result.height_cm
        existing_record.age = body.age
        existing_record.gender = body.gender
        existing_record.bmi_value = result.bmi_value
        existing_record.bmi_category = result.bmi_category
        existing_record.bmi_category_vi = result.bmi_category_vi
        db.commit()
        db.refresh(existing_record)
        return existing_record
    else:
        # Nếu chưa có, tạo bản ghi mới
        record = BMIRecord(
            user_id=current_user.id,
            weight_kg=result.weight_kg,
            height_cm=result.height_cm,
            age=body.age,
            gender=body.gender,
            bmi_value=result.bmi_value,
            bmi_category=result.bmi_category,
            bmi_category_vi=result.bmi_category_vi,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record


# --------------------------------------------------------------------------- #
#  GET /health/bmi/history  –  Lịch sử BMI của người dùng hiện tại           #
# --------------------------------------------------------------------------- #

@router.get(
    "/bmi/history",
    response_model=list[BMIRecordResponse],
    summary="Lịch sử BMI của người dùng hiện tại",
    description="Lấy toàn bộ lịch sử các lần tính BMI của người dùng hiện tại, sắp xếp mới nhất trước. Yêu cầu đăng nhập.",
    status_code=status.HTTP_200_OK,
)
def get_bmi_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Trả về danh sách các bản ghi BMI của người dùng hiện tại, sắp xếp theo thời gian giảm dần.
    Yêu cầu đăng nhập.
    """
    records = (
        db.query(BMIRecord)
        .filter(BMIRecord.user_id == current_user.id)
        .order_by(BMIRecord.created_at.desc())
        .all()
    )
    return records


# --------------------------------------------------------------------------- #
#  GET /health/weight/history  –  Lịch sử cân nặng của người dùng hiện tại   #
# --------------------------------------------------------------------------- #

@router.get(
    "/weight/history",
    response_model=WeightHistoryResponse,
    summary="Lịch sử cân nặng",
    description="Lấy lịch sử cân nặng của người dùng hiện tại, tính toán thay đổi so với lần trước. Yêu cầu đăng nhập.",
    status_code=status.HTTP_200_OK,
)
def get_weight_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Trả về lịch sử cân nặng của người dùng hiện tại,
    tính toán thay đổi (change) so với lần trước.
    Yêu cầu đăng nhập.
    """
    # Lấy tất cả bản ghi BMI, sắp xếp từ cũ đến mới để tính change
    records = (
        db.query(BMIRecord)
        .filter(BMIRecord.user_id == current_user.id)
        .order_by(BMIRecord.created_at.asc())
        .all()
    )

    history_items = []
    previous_weight = None

    for record in records:
        # Định dạng ngày: dd/mm
        date_str = record.created_at.strftime("%d/%m")
        
        # Tính change (thay đổi so với lần trước)
        change = 0.0
        if previous_weight is not None:
            change = round(record.weight_kg - previous_weight, 1)
        
        history_items.append(WeightHistoryItem(
            date=date_str,
            weight=record.weight_kg,
            change=change
        ))
        
        previous_weight = record.weight_kg

    # Đảo ngược để mới nhất lên đầu (giống mock data)
    history_items.reverse()

    return WeightHistoryResponse(history=history_items)

