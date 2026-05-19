"""
test_chatbot.py
================
Unit tests cho chatbot Gemini backend.
Chạy: pytest backend/app/health/tests/test_chatbot.py -v
"""

from fastapi import HTTPException
import pytest

from app.health.schemas.chat import ChatHistoryItem
from app.health.services import chat_service
from app.health.services.chat_service import (
    OFF_TOPIC_RESPONSE,
    ask_gemini,
    build_prompt,
    is_health_related,
)


def test_health_related_message_returns_true():
    assert is_health_related("Tôi bị đau đầu và sốt thì nên làm gì?") is True


def test_off_topic_message_returns_false():
    assert is_health_related("Hôm nay thời tiết ở Sài Gòn thế nào?") is False


def test_build_prompt_contains_bmi_and_history():
    prompt = build_prompt(
        message="Tôi muốn giảm cân an toàn",
        bmi=27.5,
        history=[ChatHistoryItem(role="user", content="Tôi cao 170cm")],
    )

    assert "BMI hiện tại của người dùng: 27.5" in prompt
    assert "user: Tôi cao 170cm" in prompt
    assert "Tôi muốn giảm cân an toàn" in prompt


def test_ask_gemini_blocks_off_topic_before_api_call():
    assert ask_gemini("Kể chuyện cười về lập trình") == OFF_TOPIC_RESPONSE


def test_ask_gemini_raises_when_api_key_missing(monkeypatch):
    monkeypatch.setattr(chat_service.settings, "GEMINI_API_KEY", None)

    with pytest.raises(HTTPException) as exc_info:
        ask_gemini("Tôi bị đau đầu thì nên làm gì?")

    assert exc_info.value.status_code == 503
    assert "GEMINI_API_KEY" in exc_info.value.detail


def test_ask_gemini_success_with_mocked_model(monkeypatch):
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
            assert api_key == "fake-api-key"

        GenerativeModel = FakeModel

    monkeypatch.setattr(chat_service.settings, "GEMINI_API_KEY", "fake-api-key")
    monkeypatch.setattr(chat_service, "genai", FakeGenAI)

    reply = ask_gemini("Tôi bị đau đầu thì nên làm gì?")

    assert "nghỉ ngơi" in reply
