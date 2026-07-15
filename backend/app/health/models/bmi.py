from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class BMIRecord(Base):
    """
    Lưu lịch sử tính BMI của từng user.
    """
    __tablename__ = "bmi_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Thông số đầu vào
    weight_kg = Column(Float, nullable=False)          
    height_cm = Column(Float, nullable=False)          
    age = Column(Integer, nullable=True)               
    gender = Column(String(10), nullable=True)         
    wrist_circumference_cm = Column(Float, nullable=True)  # Vòng cổ tay (cm)
    ankle_circumference_cm = Column(Float, nullable=True)  # Vòng cổ chân (cm)

    bmi_value = Column(Float, nullable=False)          
    bmi_category = Column(String(50), nullable=False)  
    bmi_category_vi = Column(String(50), nullable=False)  
    wrist_to_height_ratio = Column(Float, nullable=True)  # Tỷ lệ vòng cổ tay / chiều cao
    ankle_to_height_ratio = Column(Float, nullable=True)  # Tỷ lệ vòng cổ chân / chiều cao
    body_frame_size = Column(String(20), nullable=True)  # Kích thước khung xương (small/medium/large)
    healthy_weight_range_for_frame = Column(String(50), nullable=True)  # Khoảng cân nặng lý tưởng theo khung xương

    created_at = Column(DateTime(timezone=True), server_default=func.now())
