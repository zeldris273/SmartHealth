from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

# Chuẩn hóa đường dẫn import đồng bộ với toàn bộ dự án của Lạc
from app.health.core.dependencies import get_current_user  # Hàm lấy user từ token thông thường
from app.health.core.dependencies import require_role  # Hàm check quyền Admin của Lạc
from database import get_db  # Để nguyên theo đường dẫn chuẩn file main.py của bạn
from app.health.models.user import User
from app.health.schemas.user import UserProfileUpdate, UserResponse, RoleUpdate
from app.health.services.user_service import UserService

router = APIRouter(
    prefix="/users",
    tags=["Users & Management"],
)

# ==========================================
# 1. CÁC ENDPOINTS DÀNH CHO USER TỰ XỬ LÝ
# ==========================================

@router.get(
    "/me", 
    response_model=UserResponse,
    summary="Lấy thông tin profile của người dùng hiện tại"
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Cập nhật thời gian last_online_at mỗi khi người dùng lấy thông tin cá nhân
    print(f"Updating last_online_at for user: {current_user.email}, old: {current_user.last_online_at}")
    current_user.last_online_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)
    print(f"Updated last_online_at: {current_user.last_online_at}")
    return current_user


@router.patch(
    "/me", 
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin hồ sơ cá nhân (Profile)"
)
def update_my_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Gọi sang tầng Service xử lý logic kiểm tra trùng lặp SĐT/CCCD và cập nhật
    return UserService.update_profile(
        db=db, 
        current_user=current_user, 
        payload=payload
    )


# ==========================================
# 2. CÁC ENDPOINTS DÀNH CHO ADMIN QUẢN TRỊ
# ==========================================

@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="[Admin] Xem chi tiết thông tin của một User bất kỳ bằng ID"
)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")), # Ép buộc phải là Admin mới gọi được cổng này
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng này trên hệ thống.",
        )

    return user


@router.patch(
    "/{user_id}/role",
    response_model=UserResponse,
    summary="[Admin] Thay đổi quyền (Role) của người dùng"
)
def update_user_role(
    user_id: int,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng này trên hệ thống.",
        )

    # Không cho phép admin tự hạ quyền chính mình
    if current_admin.id == user.id and payload.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn không thể tự gỡ bỏ quyền Admin của chính mình.",
        )

    # Cập nhật quyền mới
    user.role = payload.role

    db.commit()
    db.refresh(user)

    return user