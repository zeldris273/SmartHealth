from pydantic import BaseModel, Field
from typing import Literal, Optional


Goal = Literal["maintain", "lose", "gain"]


# --------------------------------------------------------------------------- #
#  Component schemas                                                          #
# --------------------------------------------------------------------------- #

class WeightTrendAnalysisResponse(BaseModel):
    trend: str
    weekly_change: float
    status: str
    analysis: str
    advice: str


class FoodRecommendationsResponse(BaseModel):
    should_eat: list[str]
    should_limit: list[str]


class ExercisePlanResponse(BaseModel):
    frequency: str
    schedule: list[str]


class GoalTipsResponse(BaseModel):
    goal: str
    calorie_target: str
    macronutrient_breakdown: dict[str, str]
    example_meal: list[str]
    food_recommendations: FoodRecommendationsResponse
    exercise_plan: ExercisePlanResponse


# --------------------------------------------------------------------------- #
#  Request & Response schemas                                                 #
# --------------------------------------------------------------------------- #

class HealthTipsRequest(BaseModel):
    tdee: Optional[float] = Field(None, description="TDEE của người dùng (nếu không có, sẽ dùng giá trị mặc định)", gt=0)
    goal: Goal = Field("maintain", description="Mục tiêu: 'maintain', 'lose', hoặc 'gain'")
    current_weight: Optional[float] = Field(None, description="Cân nặng hiện tại (nếu không có, sẽ lấy từ lịch sử)", gt=0)


class HealthTipsResponse(BaseModel):
    weight_trend: WeightTrendAnalysisResponse
    goal_tips: GoalTipsResponse
