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
        content = "Ban nen nghi ngoi, uong du nuoc va theo doi nhiet do."

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
    assert "uong du nuoc" in result.reply
