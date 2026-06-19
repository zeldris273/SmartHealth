from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.health.models.user import User
from app.health.schemas.user import UserProfileUpdate


class UserService:
    @staticmethod
    def update_profile(
        db: Session,
        current_user: User,
        payload: UserProfileUpdate,
    ) -> User:
        # Chỉ lấy các trường thông tin mà Frontend thực sự gửi lên để cập nhật
        data = payload.model_dump(exclude_unset=True)

        # 1. Kiểm tra trùng lặp Số CCCD (National ID) của người khác
        if "national_id" in data and data["national_id"]:
            existing_user_by_id = (
                db.query(User)
                .filter(
                    User.national_id == data["national_id"],
                    User.id != current_user.id, # Phải loại trừ chính mình ra nhé
                )
                .first()
            )
            if existing_user_by_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Số CCCD này đã tồn tại trên hệ thống.",
                )

        # 2. ---- BỔ SUNG: Kiểm tra trùng lặp Số điện thoại (Phone Number) ----
        if "phone_number" in data and data["phone_number"]:
            existing_user_by_phone = (
                db.query(User)
                .filter(
                    User.phone_number == data["phone_number"],
                    User.id != current_user.id, # Loại trừ chính mình
                )
                .first()
            )
            if existing_user_by_phone:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Số điện thoại này đã được sử dụng bởi tài khoản khác.",
                )

        # 3. Dynamic Update: Tự động lặp qua các trường hợp lệ để gán giá trị mới
        for field, value in data.items():
            setattr(current_user, field, value)

        # 4. Lưu lại sự thay đổi vào PostgreSQL
        db.commit()
        db.refresh(current_user)

        return current_user