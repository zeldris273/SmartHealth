from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.health.core.config import settings
from app.health.models import BMIRecord, ChatMessage, User
from app.health.schemas.chat import ChatHistoryItem, ChatMessageResponse, ChatRequest, ChatResponse
from app.health.services.chat_service import ask_ai
from database import get_db


router = APIRouter(prefix="/health", tags=["Health - Chatbot"])
optional_bearer = HTTPBearer(auto_error=False)


def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    """Trả về user nếu request có Bearer token hợp lệ, ngược lại None."""
    if credentials is None:
        return None

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    return db.query(User).filter(User.id == user_id).first()


def get_latest_bmi(db: Session, user_id: int) -> BMIRecord | None:
    return (
        db.query(BMIRecord)
        .filter(BMIRecord.user_id == user_id)
        .order_by(BMIRecord.created_at.desc())
        .first()
    )


def get_recent_chat_history(db: Session, user_id: int, session_id: str, limit: int = 10):
    records = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc())
        .limit(limit)
        .all()
    )
    return [
        {"role": item.role, "content": item.content}
        for item in reversed(records)
        if item.role in {"user", "assistant"}
    ]


def save_chat_pair(
    db: Session,
    user_id: int,
    session_id: str,
    user_message: str,
    assistant_reply: str,
    provider: str,
    model_name: str,
) -> None:
    db.add(
        ChatMessage(
            user_id=user_id,
            session_id=session_id,
            role="user",
            content=user_message,
            provider=provider,
            model_name=model_name,
        )
    )
    db.add(
        ChatMessage(
            user_id=user_id,
            session_id=session_id,
            role="assistant",
            content=assistant_reply,
            provider=provider,
            model_name=model_name,
        )
    )
    db.commit()


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chatbot tư vấn sức khỏe bằng Gemini hoặc OpenAI",
    description=(
        "Nhận câu hỏi sức khỏe từ người dùng và trả lời bằng AI provider được chọn trong .env. "
        "Nếu request có Bearer token hợp lệ, API có thể tự đọc BMI mới nhất và lưu lịch sử chat."
    ),
    status_code=status.HTTP_200_OK,
)
def chat_with_ai(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> ChatResponse:
    session_id = request.session_id or uuid4().hex
    bmi = request.bmi
    history = request.history
    saved = False

    if current_user and request.use_saved_bmi and bmi is None:
        latest_bmi = get_latest_bmi(db, current_user.id)
        if latest_bmi:
            bmi = latest_bmi.bmi_value

    if current_user and request.save_history and not history:
        history_dicts = get_recent_chat_history(db, current_user.id, session_id)
        history = [ChatHistoryItem(**item) for item in history_dicts]

    result = ask_ai(
        message=request.message,
        bmi=bmi,
        history=history,
    )

    if current_user and request.save_history:
        save_chat_pair(
            db=db,
            user_id=current_user.id,
            session_id=session_id,
            user_message=request.message,
            assistant_reply=result.reply,
            provider=result.provider,
            model_name=result.model,
        )
        saved = True

    return ChatResponse(
        reply=result.reply,
        provider=result.provider,
        model=result.model,
        session_id=session_id,
        bmi=bmi,
        saved=saved,
    )


@router.get(
    "/chat/history",
    response_model=list[ChatMessageResponse],
    summary="Lấy lịch sử chat của user hiện tại",
    status_code=status.HTTP_200_OK,
)
def get_chat_history(
    session_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cần đăng nhập để xem lịch sử chat.",
        )

    query = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id)
    if session_id:
        query = query.filter(ChatMessage.session_id == session_id)

    return query.order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc()).all()
