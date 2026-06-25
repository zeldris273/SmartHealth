from sqlalchemy import Column, Date, DateTime, Integer, String, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    
    # Để nullable=True vì đăng nhập bằng Google sẽ không có mật khẩu hệ thống
    password_hash = Column(String(255), nullable=True) 
    role = Column(String(20), nullable=False, default="user")

    phone_number = Column(String(15), nullable=True)
    gender = Column(String(10), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    age = Column(Integer, nullable=True, comment="Tuổi")
    national_id = Column(String(20), unique=True, nullable=True)
    address = Column(String(255), nullable=True)
    weight = Column(Integer, nullable=True, comment="Cân nặng (kg)")
    height = Column(Integer, nullable=True, comment="Chiều cao (cm)")
    fitness_goal = Column(
        String(50),
        nullable=True,
        comment="Mục tiêu sức khỏe: lose_weight, gain_weight, maintain_weight, gain_muscle"
    )

    # ---- BỔ SUNG CÁC TRƯỜNG ĐĂNG NHẬP GOOGLE  ----
    google_id = Column(
        String(255),
        unique=True,
        nullable=True,
        comment="ID duy nhất của tài khoản Google"
    )

    avatar_url = Column(
        Text(),
        nullable=True,
        comment="Link ảnh đại diện của người dùng (hoặc base64)"
    )

    auth_provider = Column(
        String(50),
        nullable=False,
        default="local",
        comment="Nguồn đăng nhập: local, google, facebook..."
    )

    # ---- THỜI GIAN KHỞI TẠO ----
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    
    # ---- TRẠNG THÁI ONLINE ----
    last_online_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Thời gian hoạt động cuối cùng"
    )

    bmi_reminder_enabled = Column(Boolean, default=False, comment="Bật/tắt nhắc nhở cập nhật BMI")
    bmi_reminder_frequency = Column(String(20), default="weekly", comment="Tần suất nhắc nhở: daily, weekly")
    last_notification_sent_at = Column(DateTime(timezone=True), nullable=True, comment="Thời gian gửi thông báo cuối cùng")
    
    # ---- Tình trạng sức khỏe ----
    underlying_diseases = Column(String, nullable=True, comment="Danh sách bệnh nền (JSON string)")
    food_allergies = Column(String, nullable=True, comment="Danh sách dị ứng thực phẩm (JSON string)")
    activity_level = Column(String(50), nullable=True, comment="Mức độ vận động")
    other_diseases = Column(String(255), nullable=True, comment="Chi tiết bệnh nền khác")
    other_allergies = Column(String(255), nullable=True, comment="Chi tiết dị ứng khác")

    # Relationships
    oauth_tokens = relationship("OAuthToken", back_populates="user", cascade="all, delete-orphan")
    support_tickets = relationship("SupportTicket", back_populates="user", cascade="all, delete-orphan")
    health_tips = relationship("HealthTip", back_populates="user", cascade="all, delete-orphan")
