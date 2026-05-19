from typing import Literal

from pydantic import BaseModel, Field


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"] = Field(..., description="Vai trò trong lịch sử chat")
    content: str = Field(..., min_length=1, description="Nội dung tin nhắn")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Câu hỏi của người dùng")
    bmi: float | None = Field(None, gt=0, description="BMI hiện tại của người dùng nếu frontend có truyền lên")
    history: list[ChatHistoryItem] = Field(
        default_factory=list,
        max_length=10,
        description="Tối đa 10 tin nhắn gần nhất để chatbot hiểu ngữ cảnh",
    )


class ChatResponse(BaseModel):
    reply: str = Field(..., description="Câu trả lời từ chatbot")
