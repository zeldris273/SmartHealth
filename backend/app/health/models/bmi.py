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

    bmi_value = Column(Float, nullable=False)          
    bmi_category = Column(String(50), nullable=False)  
    bmi_category_vi = Column(String(50), nullable=False)  

    created_at = Column(DateTime(timezone=True), server_default=func.now())
