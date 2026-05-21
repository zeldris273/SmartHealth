from __future__ import annotations

try:
    import google.generativeai as genai
except ImportError:  # Cho phép chạy unit test trước khi cài google-generativeai
    genai = None

try:
    from openai import OpenAI
except ImportError:  # Cho phép dùng Gemini khi chưa cài openai
    OpenAI = None

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


class AIResult:
    def __init__(self, reply: str, provider: str, model: str):
        self.reply = reply
        self.provider = provider
        self.model = model


def get_ai_provider() -> str:
    provider = (getattr(settings, "AI_PROVIDER", "gemini") or "gemini").strip().lower()
    if provider not in {"gemini", "openai"}:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI_PROVIDER chỉ được là 'gemini' hoặc 'openai'.",
        )
    return provider


def get_model_name(provider: str) -> str:
    if provider == "openai":
        return getattr(settings, "OPENAI_MODEL", "gpt-4.1-mini") or "gpt-4.1-mini"
    return getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash") or "gemini-2.5-flash"


def is_health_related(message: str) -> bool:
    """Kiểm tra nhanh để chặn câu hỏi ngoài phạm vi sức khỏe trước khi gọi AI."""
    normalized = message.strip().lower()
    return any(keyword in normalized for keyword in HEALTH_KEYWORDS)


def get_bmi_category_vi(bmi: float | None) -> str | None:
    if bmi is None:
        return None
    if bmi < 18.5:
        return "Thiếu cân"
    if bmi < 25:
        return "Bình thường"
    if bmi < 30:
        return "Thừa cân"
    return "Béo phì"


def build_prompt(message: str, bmi: float | None = None, history: list[ChatHistoryItem] | None = None) -> str:
    history = history or []
    history_text = "\n".join(
        f"{item.role}: {item.content}" for item in history[-10:]
    )

    if bmi:
        category = get_bmi_category_vi(bmi)
        bmi_text = f"BMI hiện tại của người dùng: {bmi} ({category})."
    else:
        bmi_text = "Người dùng chưa có dữ liệu BMI hoặc chưa đăng nhập."

    return f"""
Bạn là chatbot hỗ trợ sức khỏe cho hệ thống SmartHealth.

Nguyên tắc bắt buộc:
- Chỉ trả lời câu hỏi liên quan đến sức khỏe, y tế, BMI, cân nặng, calories, dinh dưỡng, luyện tập và lối sống lành mạnh.
- Nếu câu hỏi nằm ngoài lĩnh vực y tế/sức khỏe, chỉ trả lời đúng câu: "{OFF_TOPIC_RESPONSE}"
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu, thực tế.
- Không chẩn đoán chắc chắn bệnh.
- Không kê đơn thuốc, không chỉ định liều thuốc nguy hiểm.
- Với triệu chứng nặng như khó thở, đau ngực, ngất, chảy máu nhiều, sốt cao kéo dài, hãy khuyên người dùng đi khám/cấp cứu.
- Nếu có BMI, hãy cá nhân hóa lời khuyên dựa trên BMI đó.

Thông tin người dùng:
{bmi_text}

Lịch sử hội thoại gần đây:
{history_text if history_text else "Không có."}

Câu hỏi hiện tại:
{message}
""".strip()


def _ask_gemini(prompt: str) -> AIResult:
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

    model_name = get_model_name("gemini")
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(model_name)
    response = model.generate_content(prompt)
    reply = getattr(response, "text", None)
    if not reply:
        raise ValueError("Gemini không trả về nội dung phản hồi.")
    return AIResult(reply=reply.strip(), provider="gemini", model=model_name)


def _ask_openai(prompt: str) -> AIResult:
    if not getattr(settings, "OPENAI_API_KEY", None) or settings.OPENAI_API_KEY == "your-openai-api-key-here":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY chưa được cấu hình trong file .env.",
        )
    if OpenAI is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chưa cài thư viện openai. Hãy chạy: pip install -r requirements.txt",
        )

    model_name = get_model_name("openai")
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.responses.create(model=model_name, input=prompt)
    reply = getattr(response, "output_text", None)
    if not reply:
        raise ValueError("OpenAI không trả về nội dung phản hồi.")
    return AIResult(reply=reply.strip(), provider="openai", model=model_name)


def ask_ai(message: str, bmi: float | None = None, history: list[ChatHistoryItem] | None = None) -> AIResult:
    if not is_health_related(message):
        provider = get_ai_provider()
        return AIResult(reply=OFF_TOPIC_RESPONSE, provider=provider, model=get_model_name(provider))

    prompt = build_prompt(message, bmi, history)
    provider = get_ai_provider()

    try:
        if provider == "openai":
            return _ask_openai(prompt)
        return _ask_gemini(prompt)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Không thể gọi {provider.upper()} API: {exc}",
        )


# Giữ tên hàm cũ để không làm hỏng code/test cũ nếu có import ask_gemini.
def ask_gemini(message: str, bmi: float | None = None, history: list[ChatHistoryItem] | None = None) -> str:
    old_provider = getattr(settings, "AI_PROVIDER", "gemini")
    try:
        settings.AI_PROVIDER = "gemini"
        return ask_ai(message=message, bmi=bmi, history=history).reply
    finally:
        settings.AI_PROVIDER = old_provider
