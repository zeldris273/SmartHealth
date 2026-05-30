import sys
import os
from sqlalchemy.orm import Session

# Add current path to sys.path so we can import from app and database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, Base, engine
from app.health.models.user import User
from app.health.services.auth_service import AuthService
from app.health.core.security import hash_password

def run_test():
    # Khởi tạo bảng dữ liệu nếu chưa tồn tại
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    email = "test_refresh_token_user_temp@example.com"
    password = "StrongPassword123!"
    
    print("1. Cleaning up any previous test user...")
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        db.delete(existing)
        db.commit()

    print("2. Creating a temporary test user...")
    test_user = User(
        full_name="Tester Refresh Token",
        email=email,
        password_hash=hash_password(password),
        role="user"
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    try:
        print("3. Attempting login using AuthService.login...")
        login_res = AuthService.login(db, email, password)
        print("   Login Response:", login_res)
        
        assert "access_token" in login_res, "Access token missing in login response!"
        assert "refresh_token" in login_res, "Refresh token missing in login response!"
        assert login_res["token_type"] == "bearer", "Token type must be bearer!"
        print("   -> Login verification SUCCESS!")
        
        refresh_token = login_res["refresh_token"]
        
        print("4. Attempting token refresh using AuthService.refresh_token...")
        refresh_res = AuthService.refresh_token(db, refresh_token)
        print("   Refresh Response:", refresh_res)
        
        assert "access_token" in refresh_res, "New access token missing in refresh response!"
        assert "refresh_token" in refresh_res, "New refresh token missing in refresh response!"
        assert refresh_res["token_type"] == "bearer", "Token type must be bearer!"
        print("   -> Refresh verification SUCCESS!")
        
        print("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The refresh token system works perfectly on the backend!")
        
    except Exception as e:
        print("❌ Test failed with exception:", str(e))
        raise e
    finally:
        print("5. Cleaning up temporary test user...")
        user_to_del = db.query(User).filter(User.email == email).first()
        if user_to_del:
            db.delete(user_to_del)
            db.commit()
        db.close()

if __name__ == "__main__":
    run_test()
