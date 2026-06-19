
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from .user import UserResponse


class SupportMessageBase(BaseModel):
    content: str = Field(..., min_length=1, description="Nội dung tin nhắn")


class SupportMessageCreate(SupportMessageBase):
    pass


class SupportMessageResponse(SupportMessageBase):
    id: int
    ticket_id: int
    sender_id: int
    sender: Optional[UserResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SupportTicketBase(BaseModel):
    subject: str = Field(..., min_length=1, max_length=255, description="Tiêu đề ticket")


class SupportTicketCreate(SupportTicketBase):
    pass


class SupportTicketResponse(SupportTicketBase):
    id: int
    user_id: int
    user: Optional[UserResponse] = None
    status: str
    created_at: datetime
    updated_at: datetime
    messages: Optional[List[SupportMessageResponse]] = None

    class Config:
        from_attributes = True
