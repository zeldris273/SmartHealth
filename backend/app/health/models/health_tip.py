from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class HealthTip(Base):
    __tablename__ = "health_tips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    tip_content = Column(String, nullable=False)
    hashtags = Column(JSON, nullable=False, default=[])
    generated_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    refresh_count = Column(Integer, default=0)

    user = relationship("User", back_populates="health_tips")