from pydantic import BaseModel, Field


# --------------------------------------------------------------------------- #
#  Request schemas                                                            #
# --------------------------------------------------------------------------- #

class CaloriesCalculationRequest(BaseModel):
    weight_kg: float = Field(..., description="Cân nặng tính bằng kilogram (kg)", gt=0, example=70)
    height_cm: float = Field(..., description="Chiều cao tính bằng centimét (cm)", gt=0, example=170)
    age: int = Field(..., description="Tuổi", gt=0, example=25)
    gender: str = Field(..., description="Giới tính: 'male' hoặc 'female'", pattern="^(male|female)$", example="male")
    activity_level: str = Field(
        ...,
        description=(
            "Mức độ hoạt động: 'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'"
        ),
        pattern="^(sedentary|lightly_active|moderately_active|very_active|extra_active)$",
        example="moderately_active"
    )


# --------------------------------------------------------------------------- #
#  Response schemas                                                           #
# --------------------------------------------------------------------------- #

class CaloriesCalculationResponse(BaseModel):
    weight_kg: float
    height_cm: float
    age: int
    gender: str
    activity_level: str
    bmr: float
    tdee: float
    activity_factor: float
    bmr_formula: str
    tdee_explanation: str
