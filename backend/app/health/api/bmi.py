"""
bmi.py  –  Health / BMI endpoints
=====================================

Prefix: /health
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from app.health.schemas import BMICalculateRequest, BMICalculateResponse, BMIRecordResponse, BMIHealthTip
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
#  POST /health/bmi/save  –  Tính & lưu kết quả vào DB (yêu cầu user_id)    #
# --------------------------------------------------------------------------- #

@router.post(
    "/bmi/save",
    response_model=BMIRecordResponse,
    summary="Tính và lưu chỉ số BMI",
    description=(
        "Tính BMI rồi lưu kết quả vào cơ sở dữ liệu liên kết với `user_id`. "
        "Dùng khi người dùng đã đăng nhập và muốn lưu lịch sử."
    ),
    status_code=status.HTTP_201_CREATED,
)
def calculate_and_save_bmi(
    body: BMICalculateRequest,
    user_id: int,
    db: Session = Depends(get_db),
):
    """
    Tính BMI và lưu bản ghi vào bảng `bmi_records`.

    Query param:
        user_id (int): ID của người dùng hiện tại.
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

    record = BMIRecord(
        user_id=user_id,
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
#  GET /health/bmi/history/{user_id}  –  Lịch sử BMI của user                #
# --------------------------------------------------------------------------- #

@router.get(
    "/bmi/history/{user_id}",
    response_model=list[BMIRecordResponse],
    summary="Lịch sử BMI của người dùng",
    description="Lấy toàn bộ lịch sử các lần tính BMI của một người dùng, sắp xếp mới nhất trước.",
    status_code=status.HTTP_200_OK,
)
def get_bmi_history(user_id: int, db: Session = Depends(get_db)):
    """
    Trả về danh sách các bản ghi BMI của `user_id`, sắp xếp theo thời gian giảm dần.
    """
    records = (
        db.query(BMIRecord)
        .filter(BMIRecord.user_id == user_id)
        .order_by(BMIRecord.created_at.desc())
        .all()
    )
    return records

