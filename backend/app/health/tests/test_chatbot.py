"""
test_chatbot.py
================
Unit tests cho chatbot backend.

Chạy:
    pytest app/health/tests/test_chatbot.py -v
"""

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.health.api import chat as chat_api
from app.health.schemas.chat import ChatMessage
from app.health.services.chat_service import build_prompt


def test_build_prompt_contains_health_guardrail():
    prompt = build_prompt(
        message="Tôi nên ăn gì để giảm cân?",
        bmi=26.5,
        history=[ChatMessage(role="user", content="Tôi cao 170cm")],
    )

    assert "SmartHealth" in prompt
    assert "BMI hiện tại của người dùng: 26.5" in prompt
    assert "Tôi nên ăn gì để giảm cân?" in prompt
    assert "chỉ hỗ trợ các câu hỏi liên quan đến lĩnh vực y tế" in prompt


def test_chat_endpoint_returns_mocked_reply(monkeypatch):
    app = FastAPI()
    app.include_router(chat_api.router)

    def fake_ask_gemini(prompt: str) -> str:
        assert "Tôi bị đau đầu nhẹ nên làm gì?" in prompt
        return "Bạn nên nghỉ ngơi, uống đủ nước và theo dõi triệu chứng."

    monkeypatch.setattr(chat_api, "ask_gemini", fake_ask_gemini)

    client = TestClient(app)
    response = client.post(
        "/health/chat",
        json={
            "message": "Tôi bị đau đầu nhẹ nên làm gì?",
            "bmi": 22.0,
            "history": [],
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "reply": "Bạn nên nghỉ ngơi, uống đủ nước và theo dõi triệu chứng."
    }
