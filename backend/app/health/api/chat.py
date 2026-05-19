from fastapi import APIRouter, status

from app.health.schemas.chat import ChatRequest, ChatResponse
from app.health.services.chat_service import ask_gemini


router = APIRouter(prefix="/health", tags=["Health - Chatbot"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chatbot tư vấn sức khỏe bằng Gemini API",
    description=(
        "Nhận câu hỏi sức khỏe từ người dùng và trả lời bằng Gemini API. "
        "API này không yêu cầu đăng nhập và không lưu hội thoại vào database."
        "Không trả lời nhưng câu hỏi nằm ngoài linh vực y tế, bị hỏi hảy đáp lại, 'Xin lỗi, tôi chỉ hỗ trợ các câu hỏi liên quan đến lĩnh vực y tế. Vui lòng đặt câu hỏi phù hợp.'"
    ),
    status_code=status.HTTP_200_OK,
)
def chat_with_gemini(request: ChatRequest) -> ChatResponse:
    reply = ask_gemini(
        message=request.message,
        bmi=request.bmi,
        history=request.history,
    )
    return ChatResponse(reply=reply)
