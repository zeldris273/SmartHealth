from pydantic import BaseModel, Field
from typing import Optional


class ChatMessage(BaseModel):
    """Một tin nhắn trong lịch sử chat."""

    role: str = Field(..., description="Vai trò: user hoặc assistant")
    content: str = Field(..., min_length=1, description="Nội dung tin nhắn")


class ChatRequest(BaseModel):
    """Request gửi câu hỏi tới chatbot sức khỏe."""

    message: str = Field(..., min_length=1, max_length=2000, description="Câu hỏi của người dùng")
    bmi: Optional[float] = Field(None, gt=0, le=100, description="BMI hiện tại của người dùng nếu có")
    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=10,
        description="Tối đa 10 tin nhắn gần nhất để chatbot hiểu ngữ cảnh",
    )


class ChatResponse(BaseModel):
    """Response từ chatbot."""

    reply: str
