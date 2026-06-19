
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class SupportTicket(Base):
    """CSKH Ticket: một cuộc trò chuyện giữa user và admin."""
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subject = Column(String(255), nullable=False, default="Yêu cầu hỗ trợ")
    status = Column(String(50), nullable=False, default="open")  # open | in_progress | closed
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_notification_sent_at = Column(DateTime(timezone=True), nullable=True)  # Lần cuối gửi email thông báo admin
    
    user = relationship("User", back_populates="support_tickets")
    messages = relationship(
        "SupportMessage",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="SupportMessage.created_at, SupportMessage.id",
    )


class SupportMessage(Base):
    """Tin nhắn trong một CSKH ticket."""
    __tablename__ = "support_messages"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    ticket = relationship("SupportTicket", back_populates="messages")
    sender = relationship("User")
