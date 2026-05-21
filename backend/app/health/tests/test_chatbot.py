"""
test_chatbot.py
================
Unit tests cho chatbot backend.
Chạy: pytest backend/app/health/tests/test_chatbot.py -v
"""

from fastapi import HTTPException
import pytest

from app.health.schemas.chat import ChatHistoryItem
from app.health.services import chat_service
from app.health.services.chat_service import (
    OFF_TOPIC_RESPONSE,
    ask_ai,
    ask_gemini,
    build_prompt,
    get_bmi_category_vi,
    is_health_related,
)


def test_health_related_message_returns_true():
    assert is_health_related("Tôi bị đau đầu và sốt thì nên làm gì?") is True


def test_off_topic_message_returns_false():
    assert is_health_related("Hôm nay thời tiết ở Sài Gòn thế nào?") is False


def test_bmi_category_vi():
    assert get_bmi_category_vi(17.5) == "Thiếu cân"
    assert get_bmi_category_vi(22.0) == "Bình thường"
    assert get_bmi_category_vi(27.5) == "Thừa cân"
    assert get_bmi_category_vi(31.0) == "Béo phì"


def test_build_prompt_contains_bmi_category_and_history():
    prompt = build_prompt(
        message="Tôi muốn giảm cân an toàn",
        bmi=27.5,
        history=[ChatHistoryItem(role="user", content="Tôi cao 170cm")],
    )

    assert "BMI hiện tại của người dùng: 27.5 (Thừa cân)" in prompt
    assert "user: Tôi cao 170cm" in prompt
    assert "Tôi muốn giảm cân an toàn" in prompt


def test_ask_ai_blocks_off_topic_before_api_call(monkeypatch):
    monkeypatch.setattr(chat_service.settings, "AI_PROVIDER", "gemini")
    result = ask_ai("Kể chuyện cười về lập trình")
    assert result.reply == OFF_TOPIC_RESPONSE
    assert result.provider == "gemini"


def test_ask_gemini_raises_when_api_key_missing(monkeypatch):
    monkeypatch.setattr(chat_service.settings, "GEMINI_API_KEY", None)

    with pytest.raises(HTTPException) as exc_info:
        ask_gemini("Tôi bị đau đầu thì nên làm gì?")

    assert exc_info.value.status_code == 503
    assert "GEMINI_API_KEY" in exc_info.value.detail


def test_ask_ai_gemini_success_with_mocked_model(monkeypatch):
    class FakeResponse:
        text = "Bạn nên nghỉ ngơi, uống đủ nước và đi khám nếu triệu chứng kéo dài."

    class FakeModel:
        def __init__(self, model_name):
            self.model_name = model_name

        def generate_content(self, prompt):
            assert "đau đầu" in prompt.lower()
            return FakeResponse()

    class FakeGenAI:
        @staticmethod
        def configure(api_key):
            assert api_key == "fake-gemini-key"

        GenerativeModel = FakeModel

    monkeypatch.setattr(chat_service.settings, "AI_PROVIDER", "gemini")
    monkeypatch.setattr(chat_service.settings, "GEMINI_API_KEY", "fake-gemini-key")
    monkeypatch.setattr(chat_service.settings, "GEMINI_MODEL", "gemini-2.5-pro")
    monkeypatch.setattr(chat_service, "genai", FakeGenAI)

    result = ask_ai("Tôi bị đau đầu thì nên làm gì?")

    assert result.provider == "gemini"
    assert result.model == "gemini-2.5-pro"
    assert "nghỉ ngơi" in result.reply


def test_ask_ai_openai_success_with_mocked_client(monkeypatch):
    class FakeResponse:
        output_text = "Bạn nên ăn uống cân bằng và theo dõi BMI định kỳ."

    class FakeResponses:
        def create(self, model, input):
            assert model == "gpt-4.1-mini"
            assert "BMI hiện tại" in input
            return FakeResponse()

    class FakeClient:
        def __init__(self, api_key):
            assert api_key == "fake-openai-key"
            self.responses = FakeResponses()

    monkeypatch.setattr(chat_service.settings, "AI_PROVIDER", "openai")
    monkeypatch.setattr(chat_service.settings, "OPENAI_API_KEY", "fake-openai-key")
    monkeypatch.setattr(chat_service.settings, "OPENAI_MODEL", "gpt-4.1-mini")
    monkeypatch.setattr(chat_service, "OpenAI", FakeClient)

    result = ask_ai("BMI của tôi cao thì nên ăn gì?", bmi=28.1)

    assert result.provider == "openai"
    assert result.model == "gpt-4.1-mini"
    assert "BMI" in result.reply
