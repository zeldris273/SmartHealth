from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.health.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.health.models.user import User
from app.health.schemas.user import UserRegister


class AuthService:
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def register(db: Session, payload: UserRegister) -> User:
        existing_user = AuthService.get_user_by_email(db, payload.email)

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )

        user = User(
            full_name=payload.full_name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role="user",
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def login(db: Session, email: str, password: str) -> dict:
        user = AuthService.get_user_by_email(db, email)

        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        access_token = create_access_token(
            subject=str(user.id),
            role=user.role,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }