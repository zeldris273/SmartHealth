from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict

from database import get_db
from app.health.core.dependencies import require_role
from app.health.models.user import User
from app.health.schemas.stats import CommunityHealthStats, BMIStats, DistributionStats, GoalStats, CalorieStats
from app.health.core.calories_calculator import calculate_bmr

router = APIRouter(
    prefix="/health/admin/stats",
    tags=["Admin Statistics"],
    dependencies=[Depends(require_role("admin"))],
)

def get_bmi_category(bmi: float) -> str:
    if bmi < 18.5:
        return "underweight"
    elif bmi < 25:
        return "normal"
    elif bmi < 30:
        return "overweight"
    else:
        return "obese"

def get_age_group(age: int) -> str:
    if age < 25:
        return "18-24"
    elif age < 35:
        return "25-34"
    elif age < 45:
        return "35-44"
    elif age < 55:
        return "45-54"
    elif age < 65:
        return "55-64"
    else:
        return "65+"

@router.get("/", response_model=CommunityHealthStats)
def get_community_health_stats(db: Session = Depends(get_db)):
    users = db.query(User).all()
    
    # BMI Distribution
    bmi_counts = {"underweight": 0, "normal": 0, "overweight": 0, "obese": 0}
    # Demographics
    gender_counts = {}
    age_group_counts = {}
    # Goals
    goal_counts = {}
    # Calorie TDEE averages
    tdee_sums = {"male": 0.0, "female": 0.0}
    tdee_counts = {"male": 0, "female": 0}

    for user in users:
        # Gender
        if user.gender:
            gender_counts[user.gender] = gender_counts.get(user.gender, 0) + 1
        
        # Age
        if user.age:
            group = get_age_group(user.age)
            age_group_counts[group] = age_group_counts.get(group, 0) + 1
            
        # Goal
        if user.fitness_goal:
            goal_counts[user.fitness_goal] = goal_counts.get(user.fitness_goal, 0) + 1
            
        # BMI & Calories
        if user.weight and user.height and user.age and user.gender in ["male", "female"]:
            # BMI
            bmi = user.weight / ((user.height / 100) ** 2)
            cat = get_bmi_category(bmi)
            bmi_counts[cat] += 1
            
            # TDEE (Average based on moderately_active = 1.55)
            try:
                bmr = calculate_bmr(float(user.weight), float(user.height), user.age, user.gender)
                tdee = bmr * 1.55
                tdee_sums[user.gender] += tdee
                tdee_counts[user.gender] += 1
            except ValueError:
                pass

    # Finalize calorie averages
    avg_tdee = {}
    for g in ["male", "female"]:
        if tdee_counts[g] > 0:
            avg_tdee[g] = round(tdee_sums[g] / tdee_counts[g], 2)
        else:
            avg_tdee[g] = 0.0

    return CommunityHealthStats(
        bmi_distribution=BMIStats(**bmi_counts),
        demographics=DistributionStats(
            gender=gender_counts,
            age_groups=age_group_counts
        ),
        popular_goals=GoalStats(goals=goal_counts),
        calorie_averages=CalorieStats(average_tdee=avg_tdee)
    )