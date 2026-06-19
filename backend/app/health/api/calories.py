from fastapi import APIRouter, HTTPException

from app.health.core import process_calories
from app.health.schemas import (
    CaloriesCalculationRequest,
    CaloriesCalculationResponse,
)


router = APIRouter(prefix="/health", tags=["Health - Calories"])


@router.post(
    "/calories",
    response_model=CaloriesCalculationResponse,
    summary="Tính lượng calo cần thiết mỗi ngày (BMR & TDEE)",
    description=(
        "Tính lượng calo cơ bản (BMR) và tổng lượng calo tiêu thụ mỗi ngày (TDEE) "
        "theo công thức chuẩn Mifflin-St Jeor Equation. Không cần đăng nhập và không lưu vào database."
    )
)
def calculate_calories(request: CaloriesCalculationRequest) -> CaloriesCalculationResponse:
    """
    Tính Calories:
    - BMR (Basal Metabolic Rate): Lượng calo cơ bản cần thiết để duy trì sự sống khi nghỉ ngơi
    - TDEE (Total Daily Energy Expenditure): Tổng lượng calo tiêu thụ mỗi ngày dựa trên mức độ hoạt động
    """
    try:
        result = process_calories(
            weight_kg=request.weight_kg,
            height_cm=request.height_cm,
            age=request.age,
            gender=request.gender,  # type: ignore
            activity_level=request.activity_level,  # type: ignore
        )
        return CaloriesCalculationResponse(**result.__dict__)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
