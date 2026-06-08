from app.health.schemas.chat import ChatHistoryItem
from app.health.services import chat_service
from app.health.services.chat_service import (
    OFF_TOPIC_RESPONSE,
    ask_ai,
    build_prompt,
    get_bmi_category_vi,
    is_health_related,
    is_health_related_with_context,
)


def test_health_related_message_returns_true():
    assert is_health_related("Tôi bị đau đầu và sốt thì nên làm gì?") is True


def test_off_topic_message_returns_false():
    assert is_health_related("Hôm nay thời tiết ở Sài Gòn thế nào?") is False


def test_follow_up_message_uses_health_context():
    history = [ChatHistoryItem(role="user", content="toi dang bi sot")]

    assert is_health_related("lam the nao de khac phuc") is False
    assert is_health_related_with_context("lam the nao de khac phuc", history) is True


def test_bmi_category_vi():
    assert get_bmi_category_vi(17.5) == "Thiếu cân"
    assert get_bmi_category_vi(22.0) == "Bình thường"
    assert get_bmi_category_vi(27.5) == "Thừa cân"
    assert get_bmi_category_vi(31.0) == "Béo phì"


def test_build_prompt_contains_bmi_history_health_context_and_rag_context():
    prompt = build_prompt(
        message="Tôi muốn tăng cơ an toàn",
        bmi=22.0,
        history=[ChatHistoryItem(role="user", content="Tôi cao 170cm")],
        health_context="BMI hiện tại: 22.0\nTDEE ước tính: 2300 kcal/ngày\nMục tiêu: tăng cơ",
        retrieved_context="[Tài liệu: nutrition.pdf | chunk 1]\nProtein hỗ trợ phục hồi cơ.",
    )

    assert "BMI hiện tại: 22.0" in prompt
    assert "TDEE ước tính: 2300 kcal/ngày" in prompt
    assert "nutrition.pdf" in prompt
    assert "Protein hỗ trợ phục hồi cơ." in prompt
    assert "user: Tôi cao 170cm" in prompt
    assert "Tôi muốn tăng cơ an toàn" in prompt


def test_ask_ai_blocks_off_topic_before_api_call(monkeypatch):
    monkeypatch.setattr(chat_service.settings, "AI_PROVIDER", "openai")
    result = ask_ai("Kể chuyện cười về lập trình")
    assert result.reply == OFF_TOPIC_RESPONSE
    assert result.provider == "openai"


def test_ask_ai_openai_success_with_mocked_client(monkeypatch):
    class FakeMessage:
        content = "Bạn nên ăn uống cân bằng và theo dõi BMI định kỳ."

    class FakeChoice:
        message = FakeMessage()

    class FakeResponse:
        choices = [FakeChoice()]

    class FakeChat:
        def create(self, model, messages, temperature=0.7, timeout=20.0):
            assert model == "gpt-4.1-mini"
            assert "BMI hiện tại" in messages[0]["content"]
            return FakeResponse()

    class FakeCompletions:
        def __init__(self):
            self.completions = FakeChat()

    class FakeClient:
        def __init__(self, api_key):
            assert api_key == "fake-openai-key"
            self.chat = FakeCompletions()

    monkeypatch.setattr(chat_service.settings, "AI_PROVIDER", "openai")
    monkeypatch.setattr(chat_service.settings, "OPENAI_API_KEY", "fake-openai-key")
    monkeypatch.setattr(chat_service.settings, "OPENAI_MODEL", "gpt-4.1-mini")
    monkeypatch.setattr(chat_service, "OpenAI", FakeClient)

    result = ask_ai("BMI của tôi cao thì nên ăn gì?", bmi=28.1)

    assert result.provider == "openai"
    assert result.model == "gpt-4.1-mini"
    assert "BMI" in result.reply


def test_ask_ai_allows_contextual_health_follow_up(monkeypatch):
    class FakeMessage:
        content = "Bạn nên nghỉ ngơi, uống đủ nước và theo dõi nhiệt độ."

    class FakeChoice:
        message = FakeMessage()

    class FakeResponse:
        choices = [FakeChoice()]

    class FakeChat:
        def create(self, model, messages, temperature=0.7, timeout=20.0):
            content = " ".join([m["content"] for m in messages])
            assert "toi dang bi sot" in content
            assert "lam the nao de khac phuc" in content
            return FakeResponse()

    class FakeCompletions:
        def __init__(self):
            self.completions = FakeChat()

    class FakeClient:
        def __init__(self, api_key):
            assert api_key == "fake-openai-key"
            self.chat = FakeCompletions()

    monkeypatch.setattr(chat_service.settings, "AI_PROVIDER", "openai")
    monkeypatch.setattr(chat_service.settings, "OPENAI_API_KEY", "fake-openai-key")
    monkeypatch.setattr(chat_service.settings, "OPENAI_MODEL", "gpt-4.1-mini")
    monkeypatch.setattr(chat_service, "OpenAI", FakeClient)

    result = ask_ai(
        "lam the nao de khac phuc",
        history=[ChatHistoryItem(role="user", content="toi dang bi sot")],
    )

    assert result.provider == "openai"
    assert "uống đủ nước" in result.reply
