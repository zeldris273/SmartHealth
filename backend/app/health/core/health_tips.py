"""
health_tips.py
==============
Business logic cho chức năng Gợi ý sức khỏe (dựa trên lịch sử cân nặng & TDEE).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal, Optional


# --------------------------------------------------------------------------- #
#  Kết quả trả về                                                             #
# --------------------------------------------------------------------------- #

Goal = Literal["maintain", "lose", "gain"]


@dataclass
class WeightTrendAnalysis:
    trend: Literal["losing", "gaining", "stable"]
    weekly_change: float
    status: Literal["safe", "too_fast", "too_slow", "stable"]
    analysis: str
    advice: str


@dataclass
class FoodRecommendations:
    should_eat: list[str]
    should_limit: list[str]


@dataclass
class ExercisePlan:
    frequency: str
    schedule: list[str]


@dataclass
class GoalTips:
    goal: Goal
    calorie_target: str
    macronutrient_breakdown: dict[str, str]
    example_meal: list[str]
    food_recommendations: FoodRecommendations
    exercise_plan: ExercisePlan


@dataclass
class HealthTipsResult:
    weight_trend: WeightTrendAnalysis
    goal_tips: GoalTips


# --------------------------------------------------------------------------- #
#  Dữ liệu gợi ý cố định                                                      #
# --------------------------------------------------------------------------- #

_GOAL_DATA: dict[Goal, dict] = {
    "maintain": {
        "calorie_adjustment": 0,
        "protein_per_kg": 1.2,
        "carbs_per_kg": 2.5,
        "fat_per_kg": 0.8,
        "food": {
            "should_eat": [
                "✅ Ăn đa dạng tất cả các loại thực phẩm",
                "✅ Rau xanh (cải xoăn, rau muống, bông cải): 2-3 bát/ngày",
                "✅ Trái cây tươi (táo, lê, dâu, chuối): 2-3 quả/ngày",
                "✅ Protein vừa phải (thịt gà, cá, trứng, đậu): 1.2g/kg cân nặng/ngày",
                "✅ Ngũ cốc nguyên cám (gạo lứt, yến mạch): Thay thế ngũ cốc tinh chế",
                "✅ Uống nước đầy đủ: 2-2.5 lít/ngày"
            ],
            "should_limit": [
                "⚠️ Không cần hạn chế quá nghiêm ngặt",
                "⚠️ Đồ ăn nhanh, đồ chiên: Ăn tối đa 1 lần/tuần",
                "⚠️ Nước ngọt có đường: Thay thế bằng nước lọc hoặc trà không đường"
            ]
        },
        "exercise": {
            "frequency": "5 ngày/tuần",
            "schedule": [
                "🏃 Cardio: 30 phút/ngày, 3 ngày/tuần (đi bộ, bơi, đạp xe)",
                "💪 Tập sức mạnh: 40 phút/ngày, 2 ngày/tuần (tất cả các nhóm cơ)",
                "😴 Nghỉ ngơi: 2 ngày/tuần (thư giãn hoàn toàn)"
            ]
        }
    },
    "lose": {
        "calorie_adjustment": -500,
        "protein_per_kg": 1.8,
        "carbs_per_kg": 1.5,
        "fat_per_kg": 0.6,
        "food": {
            "should_eat": [
                "✅ Rau xanh không tinh bột (cải xoăn, rau muống, bông cải): Ăn TỰ DO, ít nhất 3 bát/ngày",
                "✅ Trái cây ít ngọt (táo, lê, bưởi, dâu): Chỉ 2 quả/ngày, TUYỆT ĐỐI tránh trái cây ngọt (xoài, nho, chôm chôm)",
                "✅ Protein CAO (thịt gà trắng, cá, trứng, đậu): 1.8g/kg cân nặng/ngày (để no lâu, giữ cơ bắp)",
                "✅ Ngũ cốc nguyên cám: CHỈ 1-2 chén/ngày (gạo lứt, yến mạch)",
                "✅ Uống NHIỀU nước: 2.5-3 lít/ngày, UỐNG TRƯỚC BỮA ĂN 15 phút để ăn ít hơn"
            ],
            "should_limit": [
                "⚠️ Đồ ăn nhanh, đồ chiên, đồ nướng nhiều dầu: KHÔNG ĂN HOÀN TOÀN",
                "⚠️ Nước ngọt, nước ép trái cây, sinh tố có đường: KHÔNG UỐNG",
                "⚠️ Đồ uống có cồn: Hạn chế tối đa, tốt nhất là không uống",
                "⚠️ Thực phẩm chế biến sẵn (xúc xích, mì tôm): KHÔNG DÙNG",
                "⚠️ Đồ ăn vặt (bánh quy, kẹo, snack): Thay thế bằng 1 ít hạt hoặc 1 quả táo"
            ]
        },
        "exercise": {
            "frequency": "6 ngày/tuần",
            "schedule": [
                "🏃 Cardio NHIỀU: 45-60 phút/ngày, 4 ngày/tuần (đi bộ NHANH, chạy bộ, bơi)",
                "💪 Tập sức mạnh: 40 phút/ngày, 2 ngày/tuần (để giữ cơ bắp, tăng đốt cháy calo)",
                "🚶 Tăng hoạt động hàng ngày: Đi bộ thay xe máy, đi thang bộ, làm việc nhà nhiều hơn",
                "😴 Nghỉ ngơi: 1 ngày/tuần (chỉ yoga hoặc đi bộ nhẹ)"
            ]
        }
    },
    "gain": {
        "calorie_adjustment": 500,
        "protein_per_kg": 2.0,
        "carbs_per_kg": 4.0,
        "fat_per_kg": 1.0,
        "food": {
            "should_eat": [
                "✅ Protein CAO (thịt bò, thịt gà, cá hồi, trứng, sữa): 2.0g/kg cân nặng/ngày (để tăng cơ)",
                "✅ Ngũ cốc nguyên cám: NHIỀU, 3-4 chén/ngày (gạo lứt, yến mạch, bánh mì nguyên cám)",
                "✅ Trái cây NHIỀU năng lượng (chuối, xoài, nho, chôm chôm): 3-4 quả/ngày",
                "✅ Chất béo lành mạnh (dầu ô liu, hạt, quả bơ, cá béo): THÊM VÀO TẤT CẢ BỮA ĂN",
                "✅ Sữa và sản phẩm từ sữa: Uống/eat HÀNG NGÀY (sữa tươi, sữa chua, phô mai)",
                "✅ Ăn NHIỀU BỮA: 5-6 bữa/ngày (3 chính + 2-3 phụ)"
            ],
            "should_limit": [
                "⚠️ Không cần hạn chế nhiều, nhưng tránh ăn quá nhiều đồ rác để không tăng mỡ quá nhiều",
                "⚠️ KHÔNG uống quá nhiều nước TRƯỚC BỮA ĂN (để không làm no quá nhanh)",
                "⚠️ KHÔNG ăn quá nhiều rau xanh TRƯỚC BỮA ĂN chính"
            ]
        },
        "exercise": {
            "frequency": "4-5 ngày/tuần",
            "schedule": [
                "💪 Tập sức mạnh CHÍNH: 60 phút/ngày, 3-4 ngày/tuần (nâng tạ, tập cơ để tăng cơ bắp)",
                "🏃 Cardio NHẸ: CHỈ 20-30 phút/ngày, 1-2 ngày/tuần (đi bộ nhẹ, không chạy)",
                "😴 Nghỉ ngơi NHIỀU: 2-3 ngày/tuần (để cơ bắp PHỤC HỒI và PHÁT TRIỂN)"
            ]
        }
    }
}


# --------------------------------------------------------------------------- #
#  Hàm core                                                                    #
# --------------------------------------------------------------------------- #

def analyze_weight_trend(history: list) -> WeightTrendAnalysis:
    """
    Phân tích xu hướng thay đổi cân nặng từ lịch sử.

    Args:
        history: List of BMIRecord objects.

    Returns:
        WeightTrendAnalysis với trend, weekly_change, status, analysis, advice.
    """
    if len(history) < 2:
        return WeightTrendAnalysis(
            trend="stable",
            weekly_change=0.0,
            status="stable",
            analysis="Chưa có đủ dữ liệu để phân tích xu hướng cân nặng.",
            advice="Hãy lưu thêm ít nhất 2 bản ghi cân nặng để xem phân tích xu hướng."
        )

    # Sắp xếp lịch sử cũ nhất lên đầu
    sorted_history = sorted(history, key=lambda x: x.created_at)

    # Lấy bản ghi mới nhất và cũ nhất (hoặc trong 4 tuần nếu có nhiều)
    recent_records = sorted_history[-min(8, len(sorted_history)):]
    first_weight = recent_records[0].weight_kg
    last_weight = recent_records[-1].weight_kg

    # Tính số ngày giữa hai bản ghi
    days_diff = (recent_records[-1].created_at - recent_records[0].created_at).days
    if days_diff == 0:
        days_diff = 1

    # Tính thay đổi tuần
    total_change = last_weight - first_weight
    weekly_change = (total_change / days_diff) * 7

    # Xác định trend
    if weekly_change < -0.1:
        trend = "losing"
    elif weekly_change > 0.1:
        trend = "gaining"
    else:
        trend = "stable"

    # Xác định status
    if trend == "stable":
        status = "stable"
        analysis = "Cân nặng của bạn đang ổn định, không có thay đổi đáng kể."
        advice = "Tuyệt vời! Hãy duy trì chế độ ăn và vận động hiện tại!"
    elif trend == "losing":
        if -0.5 <= weekly_change < -0.1:
            status = "safe"
            analysis = f"Bạn đang giảm cân một cách an toàn: {abs(weekly_change):.1f} kg/tuần."
            advice = "Rất tốt! Tiếp tục giữ vững tốc độ này để giảm cân bền vững!"
        elif weekly_change < -1.0:
            status = "too_fast"
            analysis = f"Bạn đang giảm cân quá nhanh: {abs(weekly_change):.1f} kg/tuần!"
            advice = "Hãy tăng lượng calo tiêu thụ một chút (khoảng 200-300 kcal/ngày) để đảm bảo sức khỏe!"
        else:
            status = "too_slow"
            analysis = f"Bạn đang giảm cân khá chậm: {abs(weekly_change):.1f} kg/tuần."
            advice = "Hãy tăng cường vận động hoặc giảm lượng calo thêm khoảng 200 kcal/ngày!"
    else:  # gaining
        if 0.1 < weekly_change <= 0.5:
            status = "safe"
            analysis = f"Bạn đang tăng cân một cách an toàn: {weekly_change:.1f} kg/tuần."
            advice = "Rất tốt! Tiếp tục giữ vững tốc độ này để tăng cân bền vững!"
        elif weekly_change > 1.0:
            status = "too_fast"
            analysis = f"Bạn đang tăng cân quá nhanh: {weekly_change:.1f} kg/tuần!"
            advice = "Hãy giảm lượng calo tiêu thụ một chút (khoảng 200-300 kcal/ngày) và tăng cường vận động!"
        else:
            status = "too_slow"
            analysis = f"Bạn đang tăng cân khá chậm: {weekly_change:.1f} kg/tuần."
            advice = "Hãy tăng lượng calo thêm khoảng 200-300 kcal/ngày và tăng cường tập sức mạnh!"

    return WeightTrendAnalysis(
        trend=trend,
        weekly_change=round(weekly_change, 1),
        status=status,
        analysis=analysis,
        advice=advice
    )


def generate_goal_tips(
    tdee: float,
    goal: Goal,
    weight_kg: float,
) -> GoalTips:
    """
    Tạo gợi ý cho mục tiêu cụ thể.

    Args:
        tdee: TDEE của người dùng.
        goal: Mục tiêu (maintain, lose, gain).
        weight_kg: Cân nặng hiện tại (kg).

    Returns:
        GoalTips với đầy đủ thông tin.
    """
    data = _GOAL_DATA[goal]
    calorie_target = tdee + data["calorie_adjustment"]

    # Tính macros
    protein = round(data["protein_per_kg"] * weight_kg, 0)
    carbs = round(data["carbs_per_kg"] * weight_kg, 0)
    fat = round(data["fat_per_kg"] * weight_kg, 0)

    # Tạo goal text
    goal_texts = {
        "maintain": "Duy trì cân nặng",
        "lose": "Giảm cân",
        "gain": "Tăng cân"
    }

    # Ví dụ khẩu phần ăn (theo mục tiêu)
    example_meals = {
        "maintain": [
            " Bữa sáng: 2 quả trứng luộc + 1 bánh mì nguyên cám + 1 quả táo + 1 ly sữa tươi",
            " Bữa trưa: 150g thịt gà luộc + 2 bát rau xanh + 1 chén gạo lứt + 1 quả chuối",
            " Bữa tối: 150g cá hồi nướng + 2 bát bông cải + 1 chén gạo lứt"
        ],
        "lose": [
            " Bữa sáng: 3 quả trứng trắng + 1 bát cháo yến mạch nhỏ + 1 quả táo",
            " Bữa trưa: 180g thịt gà trắng + 3 bát rau xanh (ăn trước) + CHỈ 0.5 chén gạo lứt",
            " Bữa tối: 180g cá + 3 bát bông cải (ăn trước) + CHỈ 0.5 chén gạo lứt",
            " Bữa phụ: 1 hộp sữa chua không đường + 20g hạt hạnh nhân (nếu đói)"
        ],
        "gain": [
            " Bữa sáng: 3 quả trứng + 2 bánh mì nguyên cám + 2 muỗng bơ đậu phộng + 1 quả chuối + 1 ly sữa tươi",
            " Bữa trưa: 200g thịt bò + 2 bát rau + 2 CHÉN gạo lứt + 1 quả xoài",
            " Bữa tối: 200g cá hồi + 2 bát bông cải + 2 CHÉN gạo lứt + 1 ly sữa tươi",
            " Bữa phụ 1: 1 hộp sữa tươi + 30g hạt",
            " Bữa phụ 2: 1 quả chuối + 2 muỗng bơ đậu phộng"
        ]
    }

    return GoalTips(
        goal=goal,
        calorie_target=f"{round(calorie_target, 0)} kcal/ngày",
        macronutrient_breakdown={
            "protein": f"{protein}g/ngày",
            "carbs": f"{carbs}g/ngày",
            "fat": f"{fat}g/ngày"
        },
        example_meal=example_meals[goal],
        food_recommendations=FoodRecommendations(
            should_eat=data["food"]["should_eat"],
            should_limit=data["food"]["should_limit"]
        ),
        exercise_plan=ExercisePlan(
            frequency=data["exercise"]["frequency"],
            schedule=data["exercise"]["schedule"]
        )
    )


def process_health_tips(
    weight_history: list,
    tdee: Optional[float] = None,
    goal: Goal = "maintain",
    current_weight: Optional[float] = None,
) -> HealthTipsResult:
    """
    Tổng hợp tất cả gợi ý sức khỏe.

    Args:
        weight_history: Lịch sử cân nặng (list BMIRecord).
        tdee: TDEE của người dùng (nếu có).
        goal: Mục tiêu (mặc định maintain).
        current_weight: Cân nặng hiện tại (nếu không có, lấy từ lịch sử).

    Returns:
        HealthTipsResult.
    """
    # Phân tích xu hướng cân nặng
    weight_trend = analyze_weight_trend(weight_history)

    # Lấy cân nặng hiện tại
    if current_weight is None and len(weight_history) > 0:
        sorted_history = sorted(weight_history, key=lambda x: x.created_at)
        current_weight = sorted_history[-1].weight_kg

    # Nếu không có TDEE hoặc cân nặng hiện tại, dùng giá trị mặc định
    if tdee is None:
        tdee = 2000  # Giá trị mặc định
    if current_weight is None:
        current_weight = 70  # Giá trị mặc định

    # Tạo gợi ý theo mục tiêu
    goal_tips = generate_goal_tips(tdee, goal, current_weight)

    return HealthTipsResult(
        weight_trend=weight_trend,
        goal_tips=goal_tips
    )
