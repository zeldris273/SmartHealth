"""
test_bmi_calculator.py
=======================
Unit tests cho logic tính BMI trong core/bmi_calculator.py.
Chạy: pytest backend/app/health/tests/test_bmi_calculator.py -v
"""

import pytest
from app.health.core.bmi_calculator import (
    calculate_bmi,
    get_bmi_category,
    get_healthy_weight_range,
    process_bmi,
)


# --------------------------------------------------------------------------- #
#  calculate_bmi                                                                #
# --------------------------------------------------------------------------- #

class TestCalculateBMI:
    def test_normal_case(self):
        """70 kg / (1.70 m)^2 = 24.22"""
        assert calculate_bmi(70, 170) == 24.22

    def test_underweight(self):
        assert calculate_bmi(45, 170) == 15.57

    def test_overweight(self):
        assert calculate_bmi(85, 170) == 29.41

    def test_obese(self):
        assert calculate_bmi(110, 170) == 38.06

    def test_zero_weight_raises(self):
        with pytest.raises(ValueError, match="Cân nặng"):
            calculate_bmi(0, 170)

    def test_negative_weight_raises(self):
        with pytest.raises(ValueError):
            calculate_bmi(-5, 170)

    def test_zero_height_raises(self):
        with pytest.raises(ValueError, match="Chiều cao"):
            calculate_bmi(70, 0)

    def test_result_rounded_to_2_decimals(self):
        bmi = calculate_bmi(68, 172)
        assert len(str(bmi).split(".")[-1]) <= 2


# --------------------------------------------------------------------------- #
#  get_bmi_category                                                             #
# --------------------------------------------------------------------------- #

class TestGetBMICategory:
    @pytest.mark.parametrize("bmi,expected_en,expected_vi", [
        (15.0,  "Underweight",     "Thiếu cân"),
        (18.4,  "Underweight",     "Thiếu cân"),
        (18.5,  "Normal weight",   "Bình thường"),
        (22.0,  "Normal weight",   "Bình thường"),
        (24.9,  "Normal weight",   "Bình thường"),
        (25.0,  "Overweight",      "Thừa cân"),
        (27.5,  "Overweight",      "Thừa cân"),
        (29.9,  "Overweight",      "Thừa cân"),
        (30.0,  "Obese Class I",   "Béo phì độ I"),
        (34.9,  "Obese Class I",   "Béo phì độ I"),
        (35.0,  "Obese Class II",  "Béo phì độ II"),
        (39.9,  "Obese Class II",  "Béo phì độ II"),
        (40.0,  "Obese Class III", "Béo phì độ III (Nghiêm trọng)"),
        (55.0,  "Obese Class III", "Béo phì độ III (Nghiêm trọng)"),
    ])
    def test_categories(self, bmi, expected_en, expected_vi):
        cat = get_bmi_category(bmi)
        assert cat.category_en == expected_en
        assert cat.category_vi == expected_vi

    def test_tips_not_empty(self):
        cat = get_bmi_category(22.0)
        assert len(cat.tips) > 0
        assert "tip" in cat.tips[0]
        assert "action" in cat.tips[0]


# --------------------------------------------------------------------------- #
#  get_healthy_weight_range                                                     #
# --------------------------------------------------------------------------- #

class TestGetHealthyWeightRange:
    def test_170cm(self):
        min_w, max_w = get_healthy_weight_range(170)
        assert min_w == 53.5   # 18.5 * 1.70^2 = 53.465 → 53.5
        assert max_w == 72.0   # 24.9 * 1.70^2 = 71.961 → 72.0

    def test_min_less_than_max(self):
        min_w, max_w = get_healthy_weight_range(165)
        assert min_w < max_w

    def test_returns_floats(self):
        min_w, max_w = get_healthy_weight_range(160)
        assert isinstance(min_w, float)
        assert isinstance(max_w, float)


# --------------------------------------------------------------------------- #
#  process_bmi (integration của các hàm trên)                                 #
# --------------------------------------------------------------------------- #

class TestProcessBMI:
    def test_returns_all_fields(self):
        result = process_bmi(70, 170)
        assert result.bmi_value == 24.22
        assert result.bmi_category == "Normal weight"
        assert result.bmi_category_vi == "Bình thường"
        assert "18.5" in result.healthy_bmi_range
        assert "kg" in result.healthy_weight_range_kg
        assert len(result.tips) > 0

    def test_with_optional_params(self):
        result = process_bmi(70, 170, age=25, gender="male")
        assert result.bmi_value > 0

    def test_underweight_result(self):
        result = process_bmi(45, 170)
        assert result.bmi_category_vi == "Thiếu cân"

    def test_obese_class3(self):
        result = process_bmi(130, 170)
        assert result.bmi_category_vi == "Béo phì độ III (Nghiêm trọng)"
