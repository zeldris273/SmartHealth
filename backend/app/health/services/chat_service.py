from __future__ import annotations

try:
    from openai import OpenAI, AsyncOpenAI
except ImportError:
    OpenAI = None
    AsyncOpenAI = None

from fastapi import HTTPException, status

from app.health.core.config import settings
from app.health.schemas.chat import ChatHistoryItem

OFF_TOPIC_RESPONSE = "Xin lỗi, tôi chỉ hỗ trợ các câu hỏi liên quan đến lĩnh vực y tế và sức khỏe."
DANGEROUS_RESPONSE = "⚠️ CẢNH BÁO: Tôi không thể trả lời câu hỏi này vì lý do an toàn. Nếu bạn hoặc người thân đang gặp nguy hiểm hoặc có ý định tự làm hại, vui lòng liên hệ ngay với cơ quan y tế gần nhất, gọi cấp cứu (115) hoặc tìm kiếm sự trợ giúp từ chuyên gia tâm lý."

DANGEROUS_KEYWORDS = {
    "tự tử", "tu tử", "tự sát", "tự làm hại", "muốn chết", "cách chết", "kết thúc cuộc đời",
    "liều cao", "quá liều", "overdose", "uống thuốc ngủ", "cắt cổ tay", "treo cổ",
    "phát thuốc độc", "thuốc độc", "liều lượng nguy hiểm",
}

HEALTH_KEYWORDS = {
    "sức khỏe", "suc khoe", "y tế", "y te", "bệnh", "benh", "triệu chứng", "trieu chung",
    "đau", "dau", "sốt", "sot", "ho", "thuốc", "thuoc", "bác sĩ", "bac si", "khám", "kham",
    "bmi", "cân nặng", "can nang", "chiều cao", "chieu cao", "calo", "calorie", "calories",
    "dinh dưỡng", "dinh duong", "ăn", "an", "uống", "uong", "tập luyện", "tap luyen",
    "thể dục", "the duc", "giảm cân", "giam can", "tăng cân", "tang can", "ngủ", "ngu",
    "tim", "huyết áp", "huyet ap", "đường huyết", "duong huyet", "tiểu đường", "tieu duong",
    "stress", "căng thẳng", "cang thang", "mệt", "met", "dị ứng", "di ung", "tăng cơ", "tang co",
    "protein", "carb", "chất béo", "chat beo", "tdee", "bmr",
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
    return getattr(settings, "OPENAI_MODEL", "gpt-4.1-mini") or "gpt-4.1-mini"


def is_dangerous_question(message: str) -> bool:
    normalized = message.strip().lower()
    return any(keyword in normalized for keyword in DANGEROUS_KEYWORDS)

def is_health_related(message: str) -> bool:
    normalized = message.strip().lower()
    return any(keyword in normalized for keyword in HEALTH_KEYWORDS)


def is_health_related_with_context(message: str, history: list[ChatHistoryItem] | None = None) -> bool:
    if is_health_related(message) or is_document_query(message):
        return True

    history = history or []
    return any(is_health_related(item.content) or is_document_query(item.content) for item in history[-6:])


DOCUMENT_QUERY_KEYWORDS = {
    "tài liệu",
    "tai lieu",
    "file",
    "pdf",
    "docx",
    "txt",
    "upload",
    "đã tải",
    "da tai",
    "trong file",
    "trong tài liệu",
    "trong tai lieu",
    "theo tài liệu",
    "theo tai lieu",
    "nội dung file",
    "noi dung file",
    "đính kèm",
    "din kem",
}


def is_document_query(message: str) -> bool:
    normalized = message.strip().lower()
    return any(keyword in normalized for keyword in DOCUMENT_QUERY_KEYWORDS)


def should_use_rag(message: str, history: list[ChatHistoryItem] | None = None) -> bool:
    return is_health_related_with_context(message, history) or is_document_query(message)


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


def build_prompt(
    message: str,
    bmi: float | None = None,
    history: list[ChatHistoryItem] | None = None,
    health_context: str | None = None,
    retrieved_context: str | None = None,
) -> str:
    history = history or []
    history_text = "\n".join(f"{item.role}: {item.content}" for item in history[-10:])

    if bmi:
        category = get_bmi_category_vi(bmi)
        bmi_text = f"BMI hiện tại của người dùng: {bmi} ({category})."
    else:
        bmi_text = "Người dùng chưa có dữ liệu BMI hoặc chưa đăng nhập."

    health_context = health_context or bmi_text
    retrieved_context = retrieved_context or "Không có tài liệu liên quan được truy xuất."

    return f"""
Bạn là chatbot hỗ trợ sức khỏe cho hệ thống SmartHealth.

Nguyên tắc bắt buộc:
- Chỉ trả lời câu hỏi liên quan đến sức khỏe, y tế, BMI, cân nặng, calories, dinh dưỡng, luyện tập và lối sống lành mạnh, hoặc các câu hỏi liên quan đến việc quản lý/truy vấn tài liệu sức khỏe đã tải lên.
- Nếu người dùng thông báo đã tải lên file hoặc yêu cầu tiếp nhận file, hãy phản hồi xác nhận đã nhận được file và sẵn sàng hỗ trợ phân tích nội dung đó.
- Nếu người dùng yêu cầu kiểm tra file .docx, hãy đối chiếu nội dung trong "Ngữ cảnh tài liệu truy xuất" để xác nhận thông tin có chính xác và phù hợp với lĩnh vực y tế hay không.
- Nếu câu hỏi hoàn toàn nằm ngoài lĩnh vực y tế/sức khỏe và không liên quan đến tài liệu, chỉ trả lời đúng câu: "{OFF_TOPIC_RESPONSE}"
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu, thực tế.
- Không chẩn đoán chắc chắn bệnh.
- Không kê đơn thuốc, không chỉ định liều thuốc nguy hiểm.
- Với triệu chứng nặng như khó thở, đau ngực, ngất, chảy máu nhiều, sốt cao kéo dài, hãy khuyên người dùng đi khám/cấp cứu.
- Ưu tiên sử dụng ngữ cảnh tài liệu được truy xuất nếu phù hợp, nhưng không bịa nguồn hoặc nội dung không có trong tài liệu.
- Luôn kết hợp câu hỏi hiện tại với hồ sơ sức khỏe cá nhân khi có dữ liệu (bao gồm cả các chỉ số vòng cổ tay, cổ chân nếu có).

Thông tin sức khỏe cá nhân:
{health_context}

Ngữ cảnh tài liệu truy xuất từ pgvector:
{retrieved_context}

Lịch sử hội thoại gần đây:
{history_text if history_text else "Không có."}

Câu hỏi hiện tại:
{message}
""".strip()


async def _ask_openai_stream(prompt: str):
    api_key = getattr(settings, "OPENAI_API_KEY", None) or getattr(settings, "OPEN_API_KEY", None)

    if not api_key or api_key in ["your-openai-api-key-here", ""]:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY chưa được cấu hình trong file .env.",
        )

    if AsyncOpenAI is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chưa cài thư viện openai. Hãy chạy: pip install -r requirements.txt",
        )

    model_name = get_model_name("openai")
    client = AsyncOpenAI(api_key=api_key)

    response = await client.chat.completions.create(
        model=model_name,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        stream=True,
    )

    async for chunk in response:
        content = chunk.choices[0].delta.content
        if content:
            yield content

    # We need the model name and provider to be known by the caller. 
    # Since this is a generator, we can't easily return AIResult.
    # The caller will know it's openai and the model from get_model_name.


async def ask_ai_stream(
    message: str,
    bmi: float | None = None,
    history: list[ChatHistoryItem] | None = None,
    health_context: str | None = None,
    retrieved_context: str | None = None,
):
    if is_dangerous_question(message):
        yield DANGEROUS_RESPONSE
        return

    if not is_health_related_with_context(message, history):
        yield OFF_TOPIC_RESPONSE
        return

    prompt = build_prompt(
        message=message,
        bmi=bmi,
        history=history,
        health_context=health_context,
        retrieved_context=retrieved_context,
    )
    
    try:
        async for token in _ask_openai_stream(prompt):
            yield token
    except HTTPException:
        raise
    except Exception as exc:
        # We can't raise HTTPException inside a generator that is already streaming
        # We yield the error message instead.
        yield f"Error: {str(exc)}"

def _ask_openai(prompt: str) -> AIResult:
    api_key = getattr(settings, "OPENAI_API_KEY", None) or getattr(settings, "OPEN_API_KEY", None)

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
    response = client.chat.completions.create(
        model=model_name,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )
    reply = response.choices[0].message.content or ""
    return AIResult(reply=reply, provider="openai", model=model_name)


def ask_ai(
    message: str,
    bmi: float | None = None,
    history: list[ChatHistoryItem] | None = None,
    health_context: str | None = None,
    retrieved_context: str | None = None,
) -> AIResult:
    if is_dangerous_question(message):
        provider = get_ai_provider()
        return AIResult(reply=DANGEROUS_RESPONSE, provider=provider, model=get_model_name(provider))

    if not is_health_related_with_context(message, history):
        provider = get_ai_provider()
        return AIResult(reply=OFF_TOPIC_RESPONSE, provider=provider, model=get_model_name(provider))

    prompt = build_prompt(
        message=message,
        bmi=bmi,
        history=history,
        health_context=health_context,
        retrieved_context=retrieved_context,
    )
    provider = get_ai_provider()

    try:
        # This remains synchronous as per original implementation
        # but for streaming we use ask_ai_stream.
        return _ask_openai(prompt)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Không thể gọi {provider.upper()} API: {exc}",
        )
