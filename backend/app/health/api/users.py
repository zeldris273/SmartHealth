from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.health.core.dependencies import require_role
from database import get_db
from app.health.models.user import User
from app.health.schemas.user import RoleUpdate, UserResponse


router = APIRouter(
    prefix="/users",
    tags=["User Management"],
)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.patch(
    "/{user_id}/role",
    response_model=UserResponse,
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
            detail="User not found",
        )

    # Không cho phép admin tự hạ quyền chính mình
    if current_admin.id == user.id and payload.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own admin role",
        )

    user.role = payload.role

    db.commit()
    db.refresh(user)

    return user