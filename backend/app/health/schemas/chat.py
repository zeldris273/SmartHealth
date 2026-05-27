from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"] = Field(..., description="Vai trò trong lịch sử chat")
    content: str = Field(..., min_length=1, description="Nội dung tin nhắn")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Câu hỏi của người dùng")
    bmi: float | None = Field(None, gt=0, description="BMI hiện tại nếu frontend truyền trực tiếp")
    history: list[ChatHistoryItem] = Field(
        default_factory=list,
        max_length=10,
        description="Tối đa 10 tin nhắn gần nhất nếu frontend tự giữ lịch sử",
    )
    session_id: str | None = Field(
        None,
        max_length=64,
        description="Mã phiên chat. Nếu không truyền, backend tự tạo phiên mới.",
    )
    use_saved_bmi: bool = Field(
        True,
        description="Nếu đã đăng nhập, chatbot sẽ tự đọc BMI mới nhất trong database.",
    )
    save_history: bool = Field(
        True,
        description="Nếu đã đăng nhập, backend sẽ lưu câu hỏi và câu trả lời vào database.",
    )


class ChatResponse(BaseModel):
    reply: str = Field(..., description="Câu trả lời từ chatbot")
    provider: str = Field(..., description="AI provider đang dùng: openai")
    model: str = Field(..., description="Tên model đang dùng")
    session_id: str = Field(..., description="Mã phiên chat")
    bmi: float | None = Field(None, description="BMI chatbot đã dùng trong prompt, nếu có")
    saved: bool = Field(False, description="True nếu lịch sử chat đã được lưu vào database")


class ChatMessageResponse(BaseModel):
    id: int
    session_id: str
    role: str
    content: str
    provider: str | None = None
    model_name: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
