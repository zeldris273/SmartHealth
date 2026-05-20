from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.health.core.dependencies import get_current_user
from database import get_db
from app.health.models.user import User
from app.health.schemas.user import (
    Token,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.health.services.auth_service import AuthService


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: UserRegister,
    db: Session = Depends(get_db),
):
    return AuthService.register(db, payload)


@router.post(
    "/login",
    response_model=Token,
)
def login(
    payload: UserLogin,
    db: Session = Depends(get_db),
):
    return AuthService.login(
        db,
        payload.email,
        payload.password,
    )


# @router.get(
#     "/me",
#     response_model=UserResponse,
# )
# def get_profile(
#     current_user: User = Depends(get_current_user),
# ):
#     return current_user