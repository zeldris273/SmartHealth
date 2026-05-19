from fastapi import APIRouter, status

from app.health.schemas import ChatRequest, ChatResponse
from app.health.services.chat_service import ask_gemini, build_prompt


router = APIRouter(prefix="/health", tags=["Health - Chatbot"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chatbot tư vấn sức khỏe bằng Gemini API",
    description=(
        "Nhận câu hỏi sức khỏe của người dùng, tạo prompt an toàn và gọi Gemini API. "
        "Không yêu cầu đăng nhập, không lưu nội dung chat vào database."
        "Không trả lời nhưng câu hỏi nằm ngoài linh vực y tế, bị hỏi hảy đáp lại, 'Xin lỗi, tôi chỉ hỗ trợ các câu hỏi liên quan đến lĩnh vực y tế. Vui lòng đặt câu hỏi phù hợp.'"
    ),
    status_code=status.HTTP_200_OK,
)
def chat_with_gemini(request: ChatRequest) -> ChatResponse:
    prompt = build_prompt(
        message=request.message,
        bmi=request.bmi,
        history=request.history,
    )
    reply = ask_gemini(prompt)
    return ChatResponse(reply=reply)
