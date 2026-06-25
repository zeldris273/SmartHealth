from pydantic import BaseModel
from typing import Dict, List

class BMIStats(BaseModel):
    underweight: int
    normal: int
    overweight: int
    obese: int

class DistributionStats(BaseModel):
    gender: Dict[str, int]
    age_groups: Dict[str, int]

class GoalStats(BaseModel):
    goals: Dict[str, int]

class CalorieStats(BaseModel):
    average_tdee: Dict[str, float]

class HealthConditionsStats(BaseModel):
    underlying_diseases: Dict[str, int]
    food_allergies: Dict[str, int]
    activity_levels: Dict[str, int]

class CommunityHealthStats(BaseModel):
    bmi_distribution: BMIStats
    demographics: DistributionStats
    popular_goals: GoalStats
    calorie_averages: CalorieStats
    health_conditions: HealthConditionsStats