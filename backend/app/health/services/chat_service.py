from __future__ import annotations

import google.generativeai as genai
from fastapi import HTTPException, status

from app.health.core.config import settings
from app.health.schemas.chat import ChatMessage


MODEL_NAME = "gemini-2.5-flash"


def build_prompt(message: str, bmi: float | None = None, history: list[ChatMessage] | None = None) -> str:
    """
    Tạo prompt cho chatbot sức khỏe.
    Chatbot chỉ hỗ trợ tư vấn sức khỏe cơ bản, không thay thế bác sĩ.
    """

    history = history or []

    history_text = ""
    if history:
        safe_history = history[-10:]
        history_text = "\n".join(
            f"{item.role}: {item.content}" for item in safe_history
        )

    bmi_text = f"\nBMI hiện tại của người dùng: {bmi}" if bmi is not None else ""

    return f"""
Bạn là chatbot hỗ trợ sức khỏe của hệ thống SmartHealth.

Nhiệm vụ:
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu và thực tế.
- Chỉ trả lời các câu hỏi liên quan đến sức khỏe, dinh dưỡng, BMI, cân nặng, luyện tập, lối sống lành mạnh.
- Nếu câu hỏi không liên quan đến sức khỏe, hãy trả lời đúng câu:
  "Xin lỗi, tôi chỉ hỗ trợ các câu hỏi liên quan đến lĩnh vực y tế và sức khỏe."
- Không chẩn đoán bệnh chắc chắn.
- Không kê đơn thuốc.
- Không khuyên dùng thuốc, thực phẩm chức năng hoặc phương pháp nguy hiểm.
- Nếu người dùng có triệu chứng nặng, cấp cứu, đau dữ dội, khó thở, ngất, chảy máu nhiều hoặc có ý định tự hại bản thân, hãy khuyên họ liên hệ cơ sở y tế/bác sĩ ngay.

Thông tin người dùng:{bmi_text}

Lịch sử hội thoại gần đây:
{history_text if history_text else "Không có"}

Câu hỏi hiện tại của người dùng:
{message}

Hãy trả lời:
""".strip()


def ask_gemini(prompt: str) -> str:
    """
    Gọi Gemini API và trả về nội dung phản hồi.
    API key được đọc từ biến môi trường GEMINI_API_KEY.
    """

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your-gemini-api-key-here":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chưa cấu hình GEMINI_API_KEY trong file .env",
        )

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)

        reply = getattr(response, "text", None)
        if not reply:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Gemini không trả về nội dung phản hồi",
            )

        return reply.strip()

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Lỗi khi gọi Gemini API: {exc}",
        ) from exc
