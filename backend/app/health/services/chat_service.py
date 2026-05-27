from __future__ import annotations

try:
    from openai import OpenAI
except ImportError:
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
    provider = (getattr(settings, "AI_PROVIDER", "openai") or "openai").strip().lower()
    if provider != "openai":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hiện tại hệ thống chỉ hỗ trợ AI_PROVIDER là 'openai'.",
        )
    return provider


def get_model_name(provider: str) -> str:
    # Mặc định dùng OpenAI vì Gemini đã bị loại bỏ
    return getattr(settings, "OPENAI_MODEL", "gpt-4.1-mini") or "gpt-4.1-mini"


def is_health_related(message: str) -> bool:
    """Kiểm tra nhanh để chặn câu hỏi ngoài phạm vi sức khỏe trước khi gọi AI."""
    normalized = message.strip().lower()
    return any(keyword in normalized for keyword in HEALTH_KEYWORDS)


def is_health_related_with_context(message: str, history: list[ChatHistoryItem] | None = None) -> bool:
    """Cho phep cau hoi follow-up ngan neu lich su gan day dang noi ve suc khoe."""
    if is_health_related(message):
        return True

    history = history or []
    return any(is_health_related(item.content) for item in history[-6:])


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


def _ask_openai(prompt: str) -> AIResult:
    # Thử cả hai variant của API KEY
    api_key = (getattr(settings, "OPENAI_API_KEY", None) or 
               getattr(settings, "OPEN_API_KEY", None))
    
    if not api_key or api_key in ["your-openai-api-key-here", ""]:
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
    client = OpenAI(api_key=api_key)
    
    # Sử dụng chuẩn Chat Completion của OpenAI v1.x với timeout 20s
    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        timeout=20.0,
    )
    
    reply = response.choices[0].message.content
    if not reply:
        raise ValueError("OpenAI không trả về nội dung phản hồi.")
    
    return AIResult(reply=reply.strip(), provider="openai", model=model_name)


def ask_ai(message: str, bmi: float | None = None, history: list[ChatHistoryItem] | None = None) -> AIResult:
    if not is_health_related_with_context(message, history):
        provider = get_ai_provider()
        return AIResult(reply=OFF_TOPIC_RESPONSE, provider=provider, model=get_model_name(provider))

    prompt = build_prompt(message, bmi, history)
    provider = get_ai_provider()

    try:
        # Hệ thống giờ đây chỉ hỗ trợ OpenAI
        return _ask_openai(prompt)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Không thể gọi {provider.upper()} API: {exc}",
        )
