#!/usr/bin/env python
"""Script để thêm tài khoản trực tiếp vào database"""

import sys
import os

# Đảm bảo đường dẫn đúng
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from database import SessionLocal, Base, engine
    from app.health.models.user import User
    from app.health.core.security import hash_password
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

# Tạo các bảng nếu chưa tồn tại
try:
    Base.metadata.create_all(bind=engine)
    print("✓ Database schema created/verified")
except Exception as e:
    print(f"❌ Error creating tables: {e}")
    sys.exit(1)

# Kết nối database
db = SessionLocal()

try:
    # Kiểm tra xem email đã tồn tại chưa
    existing_user = db.query(User).filter(User.email == "sekaikamiki2309@gmail.com").first()
    if existing_user:
        print(f"❌ Email '{existing_user.email}' đã tồn tại trong database!")
        print(f"   ID: {existing_user.id}")
        sys.exit(0)
    
    # Tạo user mới
    new_user = User(
        full_name="Mrduck2324",
        email="sekaikamiki2309@gmail.com",
        password_hash=hash_password("Roti2324@232400"),
        role="user"
    )
    

    
    # Thêm vào database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    print("\n" + "="*50)
    print("✅ THÊM TÀI KHOẢN THÀNH CÔNG!")
    print("="*50)
    print(f"ID: {new_user.id}")
    print(f"Tên: {new_user.full_name}")
    print(f"Email: {new_user.email}")
    print(f"Role: {new_user.role}")
    print("="*50 + "\n")
    
except Exception as e:
    print(f"❌ Lỗi: {str(e)}")
    import traceback
    traceback.print_exc()
    db.rollback()
    sys.exit(1)
    
finally:
    db.close()
