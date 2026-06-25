from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Literal

from app.health.core import process_health_tips
from app.health.core.dependencies import get_current_user
from app.health.models import User
from app.health.models import BMIRecord
from app.health.schemas import (
    HealthTipsResponse,
    WeightTrendAnalysisResponse,
    GoalTipsResponse,
    FoodRecommendationsResponse,
    ExercisePlanResponse,
    HealthTipResponse,
    HealthTipRefreshResponse,
)
from database import get_db
from app.health.services.health_tip_service import HealthTipService


router = APIRouter(prefix="/health-tips", tags=["Health - Tips"])


@router.get(
    "/tips",
    response_model=HealthTipsResponse,
    summary="Lấy gợi ý sức khỏe dựa trên lịch sử của người dùng hiện tại",
    description="Lấy gợi ý sức khỏe dựa trên lịch sử cân nặng và thông tin của người dùng hiện tại. Yêu cầu đăng nhập."
)
def get_health_tips(
    tdee: Optional[float] = Query(None, description="TDEE của người dùng", gt=0),
    goal: Literal["maintain", "lose", "gain"] = Query("maintain", description="Mục tiêu"),
    current_weight: Optional[float] = Query(None, description="Cân nặng hiện tại", gt=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HealthTipsResponse:
    # Lấy lịch sử BMI/cân nặng của người dùng
    records = (
        db.query(BMIRecord)
        .filter(BMIRecord.user_id == current_user.id)
        .order_by(BMIRecord.created_at.desc())
        .all()
    )

    # Nếu có records, lấy cân nặng mới nhất
    if not current_weight and len(records) > 0:
        current_weight = records[0].weight_kg

    # Xử lý gợi ý
    result = process_health_tips(
        weight_history=records,
        tdee=tdee,
        goal=goal,
        current_weight=current_weight
    )

    return HealthTipsResponse(
        weight_trend=WeightTrendAnalysisResponse(**result.weight_trend.__dict__),
        goal_tips=GoalTipsResponse(
            goal=result.goal_tips.goal,
            calorie_target=result.goal_tips.calorie_target,
            macronutrient_breakdown=result.goal_tips.macronutrient_breakdown,
            example_meal=result.goal_tips.example_meal,
            food_recommendations=FoodRecommendationsResponse(**result.goal_tips.food_recommendations.__dict__),
            exercise_plan=ExercisePlanResponse(**result.goal_tips.exercise_plan.__dict__)
        )
    )


@router.get(
    "/today",
    response_model=HealthTipResponse,
    summary="Lấy lời khuyên sức khỏe hôm nay",
    description="Lấy lời khuyên sức khỏe cho ngày hôm nay. Nếu lời khuyên đã hết hạn, hệ thống sẽ tự động tạo lời khuyên mới."
)
def get_today_tip(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HealthTipResponse:
    service = HealthTipService()
    tip = service.get_or_create_daily_tip(db, current_user)
    return tip


@router.post(
    "/refresh",
    response_model=HealthTipRefreshResponse,
    summary="Làm mới lời khuyên sức khỏe",
    description="Yêu cầu tạo lời khuyên mới. Giới hạn 2 lần làm mới mỗi ngày."
)
def refresh_today_tip(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HealthTipRefreshResponse:
    service = HealthTipService()
    tip = service.refresh_tip(db, current_user)
    return HealthTipRefreshResponse(
        message="Đã làm mới lời khuyên sức khỏe thành công!",
        tip=tip
    )
