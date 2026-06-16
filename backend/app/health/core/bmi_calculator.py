"""
bmi_calculator.py
===================
Business logic cho chức năng tính BMI.

Công thức:
    BMI = weight_kg / (height_m ** 2)

Phân loại WHO (áp dụng cho người trưởng thành ≥ 18 tuổi):
    < 18.5          → Underweight    (Thiếu cân)
    18.5 – 24.9     → Normal weight  (Bình thường)
    25.0 – 29.9     → Overweight     (Thừa cân)
    30.0 – 34.9     → Obese Class I  (Béo phì độ I)
    35.0 – 39.9     → Obese Class II (Béo phì độ II)
    ≥ 40.0          → Obese Class III(Béo phì độ III – Nghiêm trọng)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


# --------------------------------------------------------------------------- #
#  Phân loại BMI                                                               #
# --------------------------------------------------------------------------- #

@dataclass(frozen=True)
class BMICategory:
    min_bmi: float          # Giới hạn dưới (inclusive)
    max_bmi: float          # Giới hạn trên (exclusive), dùng float("inf") nếu không có
    category_en: str
    category_vi: str
    tips: list[dict]        # Danh sách gợi ý {"tip": ..., "action": ...}


# Bảng phân loại theo chuẩn WHO, sắp xếp từ thấp → cao
_BMI_CATEGORIES: list[BMICategory] = [
    BMICategory(
        min_bmi=0,
        max_bmi=18.5,
        category_en="Underweight",
        category_vi="Thiếu cân",
        tips=[
            {
                "tip": "Cân nặng của bạn đang thấp hơn mức khuyến nghị.",
                "action": "Tăng lượng calo nạp vào mỗi ngày với thực phẩm giàu dinh dưỡng (ngũ cốc, protein, chất béo lành mạnh).",
            },
            {
                "tip": "Cơ thể thiếu cân có thể ảnh hưởng đến hệ miễn dịch và xương khớp.",
                "action": "Tham khảo chuyên gia dinh dưỡng để xây dựng kế hoạch ăn uống phù hợp.",
            },
            {
                "tip": "Bổ sung các bữa phụ lành mạnh.",
                "action": "Ăn 5–6 bữa nhỏ/ngày thay vì 3 bữa lớn để hỗ trợ tăng cân lành mạnh.",
            },
        ],
    ),
    BMICategory(
        min_bmi=18.5,
        max_bmi=25.0,
        category_en="Normal weight",
        category_vi="Bình thường",
        tips=[
            {
                "tip": "Tuyệt vời! Chỉ số BMI của bạn nằm trong khoảng lý tưởng.",
                "action": "Duy trì lối sống lành mạnh: tập thể dục ≥ 150 phút/tuần và ăn uống cân bằng.",
            },
            {
                "tip": "Tiếp tục giữ cân nặng ổn định.",
                "action": "Theo dõi cân nặng định kỳ mỗi 1–2 tuần để phát hiện sự thay đổi sớm.",
            },
        ],
    ),
    BMICategory(
        min_bmi=25.0,
        max_bmi=30.0,
        category_en="Overweight",
        category_vi="Thừa cân",
        tips=[
            {
                "tip": "Cân nặng của bạn đang ở mức thừa cân, có thể tăng nguy cơ bệnh tim mạch và tiểu đường.",
                "action": "Giảm 500–750 kcal/ngày so với mức tiêu thụ hiện tại để giảm cân từ từ.",
            },
            {
                "tip": "Tăng cường vận động thể chất.",
                "action": "Đặt mục tiêu tập thể dục ít nhất 30 phút/ngày, 5 ngày/tuần (đi bộ nhanh, bơi lội, đạp xe).",
            },
            {
                "tip": "Hạn chế thực phẩm chế biến sẵn và đường tinh luyện.",
                "action": "Ưu tiên rau xanh, trái cây, ngũ cốc nguyên hạt và protein nạc.",
            },
        ],
    ),
    BMICategory(
        min_bmi=30.0,
        max_bmi=35.0,
        category_en="Obese Class I",
        category_vi="Béo phì độ I",
        tips=[
            {
                "tip": "Béo phì độ I làm tăng đáng kể nguy cơ mắc các bệnh mãn tính.",
                "action": "Tham khảo bác sĩ hoặc chuyên gia dinh dưỡng để xây dựng kế hoạch giảm cân an toàn.",
            },
            {
                "tip": "Bắt đầu với những thay đổi nhỏ nhưng bền vững.",
                "action": "Thay đồ uống có đường bằng nước lọc; đi bộ ít nhất 10.000 bước/ngày.",
            },
            {
                "tip": "Theo dõi lượng calo hàng ngày.",
                "action": "Sử dụng ứng dụng theo dõi thực phẩm để kiểm soát lượng calo nạp vào.",
            },
        ],
    ),
    BMICategory(
        min_bmi=35.0,
        max_bmi=40.0,
        category_en="Obese Class II",
        category_vi="Béo phì độ II",
        tips=[
            {
                "tip": "Béo phì độ II có nguy cơ cao về sức khoẻ, cần can thiệp y tế.",
                "action": "Khẩn thiết tham khảo bác sĩ chuyên khoa nội tiết hoặc dinh dưỡng.",
            },
            {
                "tip": "Kết hợp chế độ ăn kiêng có kiểm soát với vận động thể lực phù hợp.",
                "action": "Bắt đầu với các bài tập nhẹ (bơi lội, đi bộ) để tránh chấn thương khớp.",
            },
        ],
    ),
    BMICategory(
        min_bmi=40.0,
        max_bmi=float("inf"),
        category_en="Obese Class III",
        category_vi="Béo phì độ III (Nghiêm trọng)",
        tips=[
            {
                "tip": "Đây là mức béo phì nghiêm trọng, cần được can thiệp y tế ngay.",
                "action": "Gặp bác sĩ để thảo luận các phương án điều trị, bao gồm cả phẫu thuật bariatric nếu phù hợp.",
            },
            {
                "tip": "Không tự ý áp dụng chế độ ăn kiêng cực đoan.",
                "action": "Phối hợp chặt chẽ với đội ngũ y tế để có lộ trình an toàn và hiệu quả.",
            },
        ],
    ),
]


# --------------------------------------------------------------------------- #
#  Kết quả trả về từ service                                                   #
# --------------------------------------------------------------------------- #

@dataclass
class BMIResult:
    weight_kg: float
    height_cm: float
    bmi_value: float
    bmi_category: str
    bmi_category_vi: str
    healthy_bmi_range: str
    healthy_weight_range_kg: str
    wrist_circumference_cm: Optional[float] = None
    ankle_circumference_cm: Optional[float] = None
    wrist_to_height_ratio: Optional[float] = None
    ankle_to_height_ratio: Optional[float] = None
    body_frame_size: Optional[str] = None
    healthy_weight_range_for_frame: Optional[str] = None
    tips: list[dict] = field(default_factory=list)


# --------------------------------------------------------------------------- #
#  Hàm core                                                                    #
# --------------------------------------------------------------------------- #

def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    """
    Tính giá trị BMI từ cân nặng (kg) và chiều cao (cm).

    Args:
        weight_kg: Cân nặng tính bằng kilogram.
        height_cm: Chiều cao tính bằng centimét.

    Returns:
        Giá trị BMI làm tròn 2 chữ số thập phân.

    Raises:
        ValueError: Nếu weight_kg hoặc height_cm không hợp lệ (≤ 0).
    """
    if weight_kg <= 0:
        raise ValueError(f"Cân nặng phải lớn hơn 0, nhận được: {weight_kg}")
    if height_cm <= 0:
        raise ValueError(f"Chiều cao phải lớn hơn 0, nhận được: {height_cm}")

    height_m = height_cm / 100
    bmi = weight_kg / (height_m ** 2)
    return round(bmi, 2)


def get_bmi_category(bmi_value: float) -> BMICategory:
    """
    Xác định phân loại BMI theo chuẩn WHO.

    Args:
        bmi_value: Giá trị BMI đã tính.

    Returns:
        Đối tượng BMICategory tương ứng.
    """
    for category in _BMI_CATEGORIES:
        if category.min_bmi <= bmi_value < category.max_bmi:
            return category

    # Fallback (không bao giờ xảy ra với dữ liệu hợp lệ)
    return _BMI_CATEGORIES[-1]


def get_healthy_weight_range(height_cm: float) -> tuple[float, float]:
    """
    Tính khoảng cân nặng lý tưởng (BMI 18.5 – 24.9) theo chiều cao.

    Args:
        height_cm: Chiều cao tính bằng centimét.

    Returns:
        Tuple (min_weight_kg, max_weight_kg) làm tròn 1 chữ số thập phân.
    """
    height_m = height_cm / 100
    min_weight = round(18.5 * (height_m ** 2), 1)
    max_weight = round(24.9 * (height_m ** 2), 1)
    return min_weight, max_weight


def calculate_additional_ratios(
    height_cm: float,
    wrist_circumference_cm: Optional[float] = None,
    ankle_circumference_cm: Optional[float] = None,
) -> Tuple[Optional[float], Optional[float]]:
    """
    Tính các tỷ lệ bổ sung từ vòng cổ tay và cổ chân.

    Args:
        height_cm: Chiều cao (cm).
        wrist_circumference_cm: Vòng cổ tay (cm, tuỳ chọn).
        ankle_circumference_cm: Vòng cổ chân (cm, tuỳ chọn).

    Returns:
        Tuple (wrist_to_height_ratio, ankle_to_height_ratio).
    """
    wrist_ratio = None
    ankle_ratio = None
    
    if wrist_circumference_cm and height_cm > 0:
        wrist_ratio = round(wrist_circumference_cm / height_cm, 4)
    
    if ankle_circumference_cm and height_cm > 0:
        ankle_ratio = round(ankle_circumference_cm / height_cm, 4)
    
    return wrist_ratio, ankle_ratio


def get_body_frame_size(
    height_cm: float,
    wrist_circumference_cm: float,
    gender: Optional[str] = None
) -> str:
    """
    Xác định kích thước khung xương (small/medium/large) dựa trên tỷ lệ vòng cổ tay/chiều cao.

    Args:
        height_cm: Chiều cao (cm).
        wrist_circumference_cm: Vòng cổ tay (cm).
        gender: Giới tính (tuỳ chọn, dùng để điều chỉnh ngưỡng).

    Returns:
        "small", "medium" hoặc "large".
    """
    if height_cm <= 0 or wrist_circumference_cm <= 0:
        return "medium"  # Mặc định nếu dữ liệu không hợp lệ
    
    ratio = wrist_circumference_cm / height_cm
    
    # Thresholds dựa trên các nghiên cứu phổ biến về body frame size
    if gender == "female":
        if ratio < 0.095:
            return "small"
        elif ratio < 0.105:
            return "medium"
        else:
            return "large"
    else:  # Male or other
        if ratio < 0.100:
            return "small"
        elif ratio < 0.110:
            return "medium"
        else:
            return "large"


def get_ideal_weight_range_for_frame(
    height_cm: float,
    frame_size: str
) -> Tuple[float, float]:
    """
    Tính khoảng cân nặng lý tưởng phù hợp với kích thước khung xương.

    Args:
        height_cm: Chiều cao (cm).
        frame_size: Kích thước khung xương ("small", "medium", "large").

    Returns:
        Tuple (min_weight, max_weight) tính bằng kg.
    """
    # BMI chuẩn: 18.5 - 24.9
    height_m = height_cm / 100
    base_min_bmi = 18.5
    base_max_bmi = 24.9
    
    # Điều chỉnh BMI theo khung xương
    if frame_size == "small":
        adjusted_min_bmi = base_min_bmi
        adjusted_max_bmi = base_max_bmi - 1.0
    elif frame_size == "large":
        adjusted_min_bmi = base_min_bmi + 1.0
        adjusted_max_bmi = base_max_bmi
    else:  # medium
        adjusted_min_bmi = base_min_bmi
        adjusted_max_bmi = base_max_bmi
    
    min_weight = round(adjusted_min_bmi * (height_m ** 2), 1)
    max_weight = round(adjusted_max_bmi * (height_m ** 2), 1)
    
    return min_weight, max_weight


def process_bmi(
    weight_kg: float,
    height_cm: float,
    age: Optional[int] = None,
    gender: Optional[str] = None,
    wrist_circumference_cm: Optional[float] = None,
    ankle_circumference_cm: Optional[float] = None,
) -> BMIResult:
    """
    Hàm tổng hợp: tính BMI, phân loại và trả về gợi ý sức khoẻ.

    Args:
        weight_kg : Cân nặng (kg).
        height_cm : Chiều cao (cm).
        age       : Tuổi (tuỳ chọn, hiện tại chưa dùng để phân loại riêng).
        gender    : Giới tính (tuỳ chọn, dành cho mở rộng sau).
        wrist_circumference_cm : Vòng cổ tay (cm, tuỳ chọn).
        ankle_circumference_cm : Vòng cổ chân (cm, tuỳ chọn).

    Returns:
        BMIResult chứa đầy đủ kết quả và gợi ý.
    """
    bmi_value = calculate_bmi(weight_kg, height_cm)
    category = get_bmi_category(bmi_value)
    min_w, max_w = get_healthy_weight_range(height_cm)
    wrist_ratio, ankle_ratio = calculate_additional_ratios(
        height_cm, wrist_circumference_cm, ankle_circumference_cm
    )
    
    # Tính thông tin về khung xương nếu có đủ dữ liệu
    body_frame_size = None
    healthy_weight_range_for_frame = None
    if wrist_circumference_cm:
        body_frame_size = get_body_frame_size(height_cm, wrist_circumference_cm, gender)
        frame_min_w, frame_max_w = get_ideal_weight_range_for_frame(height_cm, body_frame_size)
        healthy_weight_range_for_frame = f"{frame_min_w} – {frame_max_w} kg"

    return BMIResult(
        weight_kg=weight_kg,
        height_cm=height_cm,
        bmi_value=bmi_value,
        bmi_category=category.category_en,
        bmi_category_vi=category.category_vi,
        healthy_bmi_range="18.5 – 24.9",
        healthy_weight_range_kg=f"{min_w} – {max_w} kg",
        wrist_circumference_cm=wrist_circumference_cm,
        ankle_circumference_cm=ankle_circumference_cm,
        wrist_to_height_ratio=wrist_ratio,
        ankle_to_height_ratio=ankle_ratio,
        body_frame_size=body_frame_size,
        healthy_weight_range_for_frame=healthy_weight_range_for_frame,
        tips=category.tips,
    )
