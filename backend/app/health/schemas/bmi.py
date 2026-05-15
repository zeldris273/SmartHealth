from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime


# --------------------------------------------------------------------------- #
#  Request Schemas                                                             #
# --------------------------------------------------------------------------- #

class BMICalculateRequest(BaseModel):
    """Schema cho request tính BMI."""

    weight_kg: float = Field(..., gt=0, le=500, description="Cân nặng tính bằng kg (> 0)")
    height_cm: float = Field(..., gt=0, le=300, description="Chiều cao tính bằng cm (> 0)")
    age: Optional[int] = Field(None, ge=1, le=120, description="Tuổi (tuỳ chọn)")
    gender: Optional[Literal["male", "female", "other"]] = Field(
        None, description="Giới tính (tuỳ chọn): male | female | other"
    )

    @field_validator("weight_kg", "height_cm")
    @classmethod
    def must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Giá trị phải lớn hơn 0")
        return round(v, 2)

    model_config = {
        "json_schema_extra": {
            "example": {
                "weight_kg": 70,
                "height_cm": 170,
                "age": 25,
                "gender": "male",
            }
        }
    }


# --------------------------------------------------------------------------- #
#  Response Schemas                                                            #
# --------------------------------------------------------------------------- #

class BMIHealthTip(BaseModel):
    """Gợi ý sức khoẻ kèm theo kết quả BMI."""
    tip: str
    action: str


class BMICalculateResponse(BaseModel):
    """Schema cho response kết quả tính BMI."""

    weight_kg: float
    height_cm: float
    bmi_value: float = Field(..., description="Giá trị BMI (làm tròn 2 chữ số)")
    bmi_category: str = Field(..., description="Phân loại theo WHO (tiếng Anh)")
    bmi_category_vi: str = Field(..., description="Phân loại theo WHO (tiếng Việt)")
    healthy_bmi_range: str = Field(..., description="Khoảng BMI lý tưởng")
    healthy_weight_range_kg: str = Field(..., description="Khoảng cân nặng lý tưởng theo chiều cao")
    tips: list[BMIHealthTip] = Field(default_factory=list, description="Gợi ý sức khoẻ")

    model_config = {"from_attributes": True}


class BMIRecordResponse(BaseModel):
    """Schema cho một bản ghi BMI đã lưu trong DB."""

    id: int
    user_id: int
    weight_kg: float
    height_cm: float
    age: Optional[int]
    gender: Optional[str]
    bmi_value: float
    bmi_category: str
    bmi_category_vi: str
    created_at: datetime

    model_config = {"from_attributes": True}
