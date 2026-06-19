"""
calories_calculator.py
=======================
Business logic cho chức năng tính Calories (BMR & TDEE).

Công thức tính:
- BMR (Basal Metabolic Rate) theo Mifflin-St Jeor Equation
- TDEE (Total Daily Energy Expenditure) = BMR * activity_factor

Hệ số hoạt động:
- sedentary: 1.2
- lightly_active: 1.375
- moderately_active: 1.55
- very_active: 1.725
- extra_active: 1.9
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


# --------------------------------------------------------------------------- #
#  Hệ số hoạt động                                                            #
# --------------------------------------------------------------------------- #

ActivityLevel = Literal[
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "extra_active",
]

_ACTIVITY_FACTORS: dict[ActivityLevel, float] = {
    "sedentary": 1.2,
    "lightly_active": 1.375,
    "moderately_active": 1.55,
    "very_active": 1.725,
    "extra_active": 1.9,
}


# --------------------------------------------------------------------------- #
#  Kết quả trả về từ service                                                   #
# --------------------------------------------------------------------------- #

@dataclass
class CaloriesResult:
    weight_kg: float
    height_cm: float
    age: int
    gender: Literal["male", "female"]
    activity_level: ActivityLevel
    bmr: float
    tdee: float
    activity_factor: float
    bmr_formula: str
    tdee_explanation: str


# --------------------------------------------------------------------------- #
#  Hàm core                                                                    #
# --------------------------------------------------------------------------- #

def calculate_bmr(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: Literal["male", "female"],
) -> float:
    """
    Tính BMR (Basal Metabolic Rate) theo công thức Mifflin-St Jeor Equation.

    Args:
        weight_kg: Cân nặng tính bằng kilogram.
        height_cm: Chiều cao tính bằng centimét.
        age: Tuổi.
        gender: Giới tính ("male" hoặc "female").

    Returns:
        Giá trị BMR làm tròn 0 chữ số thập phân.

    Raises:
        ValueError: Nếu các giá trị đầu vào không hợp lệ.
    """
    if weight_kg <= 0:
        raise ValueError(f"Cân nặng phải lớn hơn 0, nhận được: {weight_kg}")
    if height_cm <= 0:
        raise ValueError(f"Chiều cao phải lớn hơn 0, nhận được: {height_cm}")
    if age <= 0:
        raise ValueError(f"Tuổi phải lớn hơn 0, nhận được: {age}")
    if gender not in ("male", "female"):
        raise ValueError(f"Giới tính phải là 'male' hoặc 'female', nhận được: {gender}")

    if gender == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    return round(bmr, 0)


def calculate_tdee(bmr: float, activity_level: ActivityLevel) -> float:
    """
    Tính TDEE (Total Daily Energy Expenditure) từ BMR và mức độ hoạt động.

    Args:
        bmr: Giá trị BMR đã tính.
        activity_level: Mức độ hoạt động.

    Returns:
        Giá trị TDEE làm tròn 0 chữ số thập phân.
    """
    factor = _ACTIVITY_FACTORS[activity_level]
    return round(bmr * factor, 0)


def get_activity_level_info(activity_level: ActivityLevel) -> tuple[float, str]:
    """
    Lấy hệ số và giải thích cho mức độ hoạt động.

    Args:
        activity_level: Mức độ hoạt động.

    Returns:
        Tuple (activity_factor, explanation).
    """
    factor = _ACTIVITY_FACTORS[activity_level]

    explanations = {
        "sedentary": "Ngồi nhiều, ít hoặc không tập thể dục",
        "lightly_active": "Tập thể dục nhẹ 1-3 ngày/tuần",
        "moderately_active": "Tập thể dục trung bình 3-5 ngày/tuần",
        "very_active": "Tập thể dục nặng 6-7 ngày/tuần",
        "extra_active": "Công việc nặng hoặc tập thể dục rất nặng",
    }

    return factor, explanations[activity_level]


def process_calories(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: Literal["male", "female"],
    activity_level: ActivityLevel,
) -> CaloriesResult:
    """
    Hàm tổng hợp: tính BMR, TDEE và trả về đầy đủ kết quả.

    Args:
        weight_kg: Cân nặng (kg).
        height_cm: Chiều cao (cm).
        age: Tuổi.
        gender: Giới tính ("male" hoặc "female").
        activity_level: Mức độ hoạt động.

    Returns:
        CaloriesResult chứa đầy đủ kết quả.
    """
    bmr = calculate_bmr(weight_kg, height_cm, age, gender)
    tdee = calculate_tdee(bmr, activity_level)
    activity_factor, activity_explanation = get_activity_level_info(activity_level)

    bmr_formula = (
        f"BMR = 10 × {weight_kg} + 6.25 × {height_cm} - 5 × {age} {'+ 5' if gender == 'male' else '- 161'}"
    )

    tdee_explanation = (
        f"TDEE = {bmr} (BMR) × {activity_factor} ({activity_explanation})"
    )

    return CaloriesResult(
        weight_kg=weight_kg,
        height_cm=height_cm,
        age=age,
        gender=gender,
        activity_level=activity_level,
        bmr=bmr,
        tdee=tdee,
        activity_factor=activity_factor,
        bmr_formula=bmr_formula,
        tdee_explanation=tdee_explanation,
    )
