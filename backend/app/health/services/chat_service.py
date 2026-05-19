try:
    import google.generativeai as genai
except ImportError:  # Cho phép chạy unit test trước khi cài google-generativeai
    genai = None

from fastapi import HTTPException, status

from app.health.core.config import settings
from app.health.schemas.chat import ChatHistoryItem

OFF_TOPIC_RESPONSE = "Xin lỗi, tôi chỉ hỗ trợ các câu hỏi liên quan đến lĩnh vực y tế và sức khỏe."

HEALTH_KEYWORDS = {
    "sức khỏe", "suc khoe", "y tế", "y te", "bệnh", "benh", "triệu chứng", "trieu chung",
    "đau", "dau", "sốt", "sot", "ho", "thuốc", "thuoc", "bác sĩ", "bac si", "khám", "kham",
    "bmi", "cân nặng", "can nang", "chiều cao", "chieu cao", "calo", "calorie", "calories",
    "dinh dưỡng", "dinh duong", "ăn", "an", "uống", "uong", "tập luyện", "tap luyen",
    "thể dục", "the duc", "giảm cân", "giam can", "tăng cân", "tang can", "ngủ", "ngu",
    "tim", "huyết áp", "huyet ap", "đường huyết", "duong huyet", "tiểu đường", "tieu duong",
    "stress", "căng thẳng", "cang thang", "mệt", "met", "dị ứng", "di ung",
}


def is_health_related(message: str) -> bool:
    """Kiểm tra nhanh để chặn câu hỏi ngoài phạm vi sức khỏe trước khi gọi Gemini."""
    normalized = message.strip().lower()
    return any(keyword in normalized for keyword in HEALTH_KEYWORDS)


def build_prompt(message: str, bmi: float | None = None, history: list[ChatHistoryItem] | None = None) -> str:
    history = history or []
    history_text = "\n".join(
        f"{item.role}: {item.content}" for item in history[-10:]
    )

    bmi_text = f"BMI hiện tại của người dùng: {bmi}." if bmi else "Người dùng chưa cung cấp BMI."

    return f"""
Bạn là chatbot hỗ trợ sức khỏe cho hệ thống SmartHealth.

Nguyên tắc bắt buộc:
- Chỉ trả lời câu hỏi liên quan đến sức khỏe, y tế, BMI, cân nặng, calories, dinh dưỡng, luyện tập và lối sống lành mạnh.
- Nếu câu hỏi nằm ngoài lĩnh vực y tế/sức khỏe, chỉ trả lời đúng câu: "{OFF_TOPIC_RESPONSE}"
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu, thực tế.
- Không chẩn đoán chắc chắn bệnh.
- Không kê đơn thuốc, không chỉ định liều thuốc nguy hiểm.
- Với triệu chứng nặng như khó thở, đau ngực, ngất, chảy máu nhiều, sốt cao kéo dài, hãy khuyên người dùng đi khám/cấp cứu.

Thông tin người dùng:
{bmi_text}

Lịch sử hội thoại gần đây:
{history_text if history_text else "Không có."}

Câu hỏi hiện tại:
{message}
""".strip()


def ask_gemini(message: str, bmi: float | None = None, history: list[ChatHistoryItem] | None = None) -> str:
    if not is_health_related(message):
        return OFF_TOPIC_RESPONSE

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your-gemini-api-key-here":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GEMINI_API_KEY chưa được cấu hình trong file .env.",
        )

    if genai is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chưa cài thư viện google-generativeai. Hãy chạy: pip install -r requirements.txt",
        )

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(build_prompt(message, bmi, history))
        reply = getattr(response, "text", None)
        if not reply:
            raise ValueError("Gemini không trả về nội dung phản hồi.")
        return reply.strip()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Không thể gọi Gemini API: {exc}",
        )
