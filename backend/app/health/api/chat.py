from datetime import date, datetime, timezone, timedelta
from uuid import uuid4

import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.health.core.calories_calculator import process_calories
from app.health.core.config import settings
from app.health.models import BMIRecord, ChatMessage, ChatSession, User
from app.health.schemas.chat import (
    ChatConversationMessage,
    ChatConversationResponse,
    ChatHistoryItem,
    ChatMessageResponse,
    ChatRequest,
    ChatResponse,
    ChatSessionUpdateRequest,
)
from app.health.services.chat_service import ask_ai_stream, get_model_name, should_use_rag, is_document_query
from app.health.services.rag_service import RetrievedChunk, format_retrieved_context, search_relevant_chunks
from database import get_db


router = APIRouter(prefix="/health", tags=["Health - Chatbot"])
optional_bearer = HTTPBearer(auto_error=False)


def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    db: Session = Depends(get_db),
) -> User | None:
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


def get_bmi_history(db: Session, user_id: int, limit: int = 5) -> list[BMIRecord]:
    return (
        db.query(BMIRecord)
        .filter(BMIRecord.user_id == user_id)
        .order_by(BMIRecord.created_at.desc())
        .limit(limit)
        .all()
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


def get_today_message_count(db: Session, user_id: int) -> int:
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .filter(ChatMessage.role == "user")
        .filter(ChatMessage.created_at >= today_start)
        .count()
    )


def calculate_age(born: date | None) -> int | None:
    if born is None:
        return None
    today = date.today()
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))


def goal_label(goal: str | None) -> str:
    labels = {
        "lose_weight": "giảm cân",
        "gain_weight": "tăng cân",
        "maintain_weight": "duy trì cân nặng",
        "gain_muscle": "tăng cơ",
    }
    return labels.get(goal or "", goal or "chưa có")


def build_health_context(user: User | None, latest_bmi: BMIRecord | None, bmi_history: list[BMIRecord]) -> str:
    if user is None:
        return "Người dùng chưa đăng nhập, chưa có hồ sơ sức khỏe cá nhân."

    age = calculate_age(user.date_of_birth)
    weight = latest_bmi.weight_kg if latest_bmi else user.weight
    height = latest_bmi.height_cm if latest_bmi else user.height
    gender = latest_bmi.gender if latest_bmi and latest_bmi.gender else user.gender

    lines = [
        f"Tuổi: {age if age else 'chưa có'}",
        f"Giới tính: {gender or 'chưa có'}",
        f"Chiều cao: {height if height else 'chưa có'} cm",
        f"Cân nặng: {weight if weight else 'chưa có'} kg",
        f"Vòng cổ tay: {user.wrist_circumference if user.wrist_circumference else 'chưa có'} cm",
        f"Vòng cổ chân: {user.ankle_circumference if user.ankle_circumference else 'chưa có'} cm",
        f"Mục tiêu: {goal_label(user.fitness_goal)}",
        f"Mức độ vận động: {user.activity_level or 'chưa có'}",
        f"Bệnh nền: {user.underlying_diseases or 'không có'}",
        f"Dị ứng thực phẩm: {user.food_allergies or 'không có'}",
    ]
    if user.other_diseases:
        lines.append(f"Chi tiết bệnh nền khác: {user.other_diseases}")
    if user.other_allergies:
        lines.append(f"Chi tiết dị ứng khác: {user.other_allergies}")

    if latest_bmi:
        lines.append(f"BMI hiện tại: {latest_bmi.bmi_value} ({latest_bmi.bmi_category_vi})")

    if bmi_history:
        history = ", ".join(
            f"{record.created_at.strftime('%d/%m/%Y')}: {record.bmi_value}"
            for record in bmi_history
            if record.created_at
        )
        lines.append(f"Lịch sử BMI gần đây: {history}")

    if weight and height and age and gender in {"male", "female"}:
        calories = process_calories(
            weight_kg=float(weight),
            height_cm=float(height),
            age=age,
            gender=gender,
            activity_level="moderately_active",
        )
        daily_target = calories.tdee
        if user.fitness_goal == "lose_weight":
            daily_target = calories.tdee - 500
        elif user.fitness_goal == "gain_weight":
            daily_target = calories.tdee + 300
        elif user.fitness_goal == "gain_muscle":
            daily_target = calories.tdee + 250

        lines.append(f"TDEE ước tính: {calories.tdee} kcal/ngày (mức hoạt động mặc định: moderately_active)")
        lines.append(f"Daily calories gợi ý theo mục tiêu: {daily_target} kcal/ngày")
    else:
        lines.append("Calories/TDEE: chưa đủ dữ liệu để ước tính.")

    return "\n".join(lines)


DEFAULT_SESSION_TITLE = "Cuộc trò chuyện mới"


def derive_session_title(text: str) -> str:
    clean = " ".join(text.split()).strip()
    if not clean:
        return "Tài liệu đã tải lên"
    return clean[:34] + "..." if len(clean) > 34 else clean


def get_chat_session(db: Session, user_id: int, session_id: str) -> ChatSession | None:
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id, ChatSession.session_id == session_id)
        .first()
    )


def ensure_chat_session(
    db: Session,
    user_id: int,
    session_id: str,
    first_user_message: str | None = None,
) -> ChatSession:
    session = get_chat_session(db, user_id, session_id)
    now = datetime.now(timezone.utc)

    if session is None:
        title = derive_session_title(first_user_message) if first_user_message else DEFAULT_SESSION_TITLE
        session = ChatSession(
            user_id=user_id,
            session_id=session_id,
            title=title,
            created_at=now,
            updated_at=now,
        )
        db.add(session)
        return session

    if session.title == DEFAULT_SESSION_TITLE and first_user_message:
        session.title = derive_session_title(first_user_message)

    session.updated_at = now
    return session


def build_rag_sources(chunks: list[RetrievedChunk]) -> list[str]:
    seen: set[str] = set()
    sources: list[str] = []
    for chunk in chunks:
        label = f"{chunk.filename}#{chunk.chunk_index + 1}"
        if label in seen:
            continue
        seen.add(label)
        sources.append(label)
    return sources


def filter_chunks_for_sources(chunks: list[RetrievedChunk]) -> list[RetrievedChunk]:
    threshold = getattr(settings, "RAG_SOURCES_THRESHOLD", 0.42)
    return [chunk for chunk in chunks if chunk.score >= threshold]


def save_chat_pair(
    db: Session,
    user_id: int,
    session_id: str,
    user_message: str,
    assistant_reply: str,
    provider: str,
    model_name: str,
    sources: list[str] | None = None,
) -> None:
    ensure_chat_session(db, user_id, session_id, user_message)
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
            sources=sources or None,
        )
    )
    db.commit()


def build_conversation_response(db: Session, user_id: int, session: ChatSession) -> ChatConversationResponse:
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id, ChatMessage.session_id == session.session_id)
        .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
        .all()
    )
    return ChatConversationResponse(
        session_id=session.session_id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[ChatConversationMessage.model_validate(message) for message in messages],
    )


def get_or_create_legacy_session(
    db: Session,
    user_id: int,
    session_id: str,
    first_message_at: datetime,
    last_message_at: datetime,
) -> ChatSession:
    session = get_chat_session(db, user_id, session_id)
    if session:
        return session

    first_user_message = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == user_id,
            ChatMessage.session_id == session_id,
            ChatMessage.role == "user",
        )
        .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
        .first()
    )
    title = derive_session_title(first_user_message.content) if first_user_message else DEFAULT_SESSION_TITLE
    session = ChatSession(
        user_id=user_id,
        session_id=session_id,
        title=title,
        created_at=first_message_at,
        updated_at=last_message_at,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post(
    "/chat",
    summary="Chatbot tư vấn sức khỏe bằng RAG + OpenAI (Streaming)",
    status_code=status.HTTP_200_OK,
)
async def chat_with_ai(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    session_id = request.session_id or uuid4().hex
    bmi = request.bmi
    history = request.history
    latest_bmi = None
    bmi_history: list[BMIRecord] = []
    retrieved_context = None
    sources: list[str] = []

    if current_user:
        latest_bmi = get_latest_bmi(db, current_user.id)
        bmi_history = get_bmi_history(db, current_user.id)

    if current_user and request.use_saved_bmi and bmi is None and latest_bmi:
        bmi = latest_bmi.bmi_value

    if current_user and request.save_history and not history:
        history_dicts = get_recent_chat_history(db, current_user.id, session_id)
        history = [ChatHistoryItem(**item) for item in history_dicts]

    if current_user and request.use_rag and should_use_rag(request.message, history):
        chunks = search_relevant_chunks(db, current_user.id, request.message)
        retrieved_context = format_retrieved_context(chunks)
        sources = build_rag_sources(filter_chunks_for_sources(chunks))

    health_context = build_health_context(current_user, latest_bmi, bmi_history)

    async def event_generator():
        full_reply = ""
        try:
            yield f"data: {json.dumps({'sources': sources}, ensure_ascii=False)}\n\n"

            async for token in ask_ai_stream(
                message=request.message,
                bmi=bmi,
                history=history,
                health_context=health_context,
                retrieved_context=retrieved_context,
            ):
                full_reply += token
                yield f"data: {json.dumps({'token': token}, ensure_ascii=False)}\n\n"

            yield f"data: {json.dumps({'done': True, 'sources': sources, 'session_id': session_id}, ensure_ascii=False)}\n\n"

            if current_user and request.save_history and full_reply:
                save_chat_pair(
                    db=db,
                    user_id=current_user.id,
                    session_id=session_id,
                    user_message=request.message,
                    assistant_reply=full_reply,
                    provider="openai", # Defaulting to openai as per chat_service.py
                    model_name=get_model_name("openai"), 
                    sources=sources,
                )
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
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


@router.get(
    "/chat/conversations",
    response_model=list[ChatConversationResponse],
    summary="Lấy danh sách cuộc trò chuyện của user hiện tại",
    status_code=status.HTTP_200_OK,
)
def get_chat_conversations(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cần đăng nhập để xem lịch sử chat.",
        )

    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc(), ChatSession.id.desc())
        .all()
    )

    known_session_ids = {session.session_id for session in sessions}
    legacy_sessions = (
        db.query(
            ChatMessage.session_id.label("session_id"),
            func.min(ChatMessage.created_at).label("created_at"),
            func.max(ChatMessage.created_at).label("updated_at"),
        )
        .filter(ChatMessage.user_id == current_user.id)
        .group_by(ChatMessage.session_id)
        .all()
    )

    for legacy in legacy_sessions:
        if legacy.session_id in known_session_ids:
            continue
        sessions.append(
            get_or_create_legacy_session(
                db,
                current_user.id,
                legacy.session_id,
                legacy.created_at,
                legacy.updated_at,
            )
        )

    sessions.sort(key=lambda item: item.updated_at or item.created_at, reverse=True)
    return [build_conversation_response(db, current_user.id, session) for session in sessions]


@router.patch(
    "/chat/sessions/{session_id}",
    response_model=ChatConversationResponse,
    summary="Đổi tên cuộc trò chuyện",
    status_code=status.HTTP_200_OK,
)
def rename_chat_session(
    session_id: str,
    request: ChatSessionUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cần đăng nhập để đổi tên cuộc trò chuyện.",
        )

    session = get_chat_session(db, current_user.id, session_id)
    if session is None:
        has_messages = (
            db.query(ChatMessage.id)
            .filter(ChatMessage.user_id == current_user.id, ChatMessage.session_id == session_id)
            .first()
        )
        if not has_messages:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy cuộc trò chuyện.")
        session = ensure_chat_session(db, current_user.id, session_id)

    session.title = request.title.strip()
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return build_conversation_response(db, current_user.id, session)


@router.delete(
    "/chat/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa cuộc trò chuyện",
)
def delete_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cần đăng nhập để xóa cuộc trò chuyện.",
        )

    db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id,
        ChatMessage.session_id == session_id,
    ).delete(synchronize_session=False)
    db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id,
        ChatSession.session_id == session_id,
    ).delete(synchronize_session=False)
    db.commit()
