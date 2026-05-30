from sqlalchemy import Column, Date, DateTime, Integer, String
from sqlalchemy.sql import func

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
    national_id = Column(String(20), unique=True, nullable=True)
    address = Column(String(255), nullable=True)

    # ---- BỔ SUNG CÁC TRƯỜNG ĐĂNG NHẬP GOOGLE  ----
    google_id = Column(
        String(255),
        unique=True,
        nullable=True,
        comment="ID duy nhất của tài khoản Google"
    )

    avatar_url = Column(
        String(500),
        nullable=True,
        comment="Link ảnh đại diện của người dùng"
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

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )