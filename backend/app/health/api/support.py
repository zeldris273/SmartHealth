
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timezone, timedelta

from database import get_db
from app.health.models.user import User
from app.health.models.support import SupportTicket, SupportMessage
from app.health.schemas.support import (
    SupportTicketCreate, SupportTicketResponse,
    SupportMessageCreate, SupportMessageResponse
)
from app.health.core.dependencies import get_current_user, require_role
from app.health.services.email_service import EmailService


router = APIRouter(
    prefix="/support",
    tags=["Support / CSKH"],
)


def is_admin_online(db: Session) -> bool:
    """Kiểm tra xem có admin nào online không (trong 30 giây gần nhất)."""
    now = datetime.now(timezone.utc)
    thirty_seconds_ago = now - timedelta(seconds=30)
    
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        admin_last_online = admin.last_online_at
        if admin_last_online.tzinfo is None:
            admin_last_online = admin_last_online.replace(tzinfo=timezone.utc)
        else:
            admin_last_online = admin_last_online.astimezone(timezone.utc)
        
        if admin_last_online >= thirty_seconds_ago:
            return True
    return False


def send_admin_notification_task(
    user_full_name: str,
    user_email: str,
    ticket_subject: str,
    message_content: str
):
    """Background task để gửi email thông báo cho admin"""
    try:
        from app.health.core.config import settings
        
        if not settings.ADMIN_EMAIL or settings.ADMIN_EMAIL == "admin@example.com":
            return
        
        EmailService.send_admin_notification_email(
            user_full_name=user_full_name,
            user_email=user_email,
            ticket_subject=ticket_subject,
            message_content=message_content
        )
    except Exception as e:
        import logging
        logging.error(f"Error sending admin notification email: {e}")


# ================================
# USER ENDPOINTS (cho người dùng)
# ================================

@router.post("/tickets", response_model=SupportTicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket: SupportTicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tạo ticket CSKH mới cho người dùng hiện tại."""
    new_ticket = SupportTicket(
        user_id=current_user.id,
        subject=ticket.subject,
        status="open"
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    # Load user relationship
    db.refresh(new_ticket, attribute_names=["user"])
    return new_ticket


@router.get("/tickets/me", response_model=List[SupportTicketResponse])
def get_my_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy tất cả ticket của người dùng hiện tại."""
    tickets = db.query(SupportTicket).filter(
        SupportTicket.user_id == current_user.id
    ).order_by(SupportTicket.updated_at.desc()).all()
    return tickets


@router.get("/tickets/me/{ticket_id}", response_model=SupportTicketResponse)
def get_my_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy chi tiết một ticket của người dùng hiện tại."""
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id,
        SupportTicket.user_id == current_user.id
    ).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket không tồn tại"
        )
    
    # Load messages and users
    ticket = db.query(SupportTicket).options(
        joinedload(SupportTicket.user),
        joinedload(SupportTicket.messages).joinedload(SupportMessage.sender)
    ).filter(SupportTicket.id == ticket_id).first()
    
    return ticket


@router.post("/tickets/me/{ticket_id}/messages", response_model=SupportMessageResponse, status_code=status.HTTP_201_CREATED)
def send_message_to_ticket(
    ticket_id: int,
    message: SupportMessageCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gửi tin nhắn vào ticket (cho user)"""
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id,
        SupportTicket.user_id == current_user.id
    ).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket không tồn tại"
        )
    
    # Cập nhật updated_at của ticket
    ticket.updated_at = datetime.now(timezone.utc)
    
    new_message = SupportMessage(
        ticket_id=ticket_id,
        sender_id=current_user.id,
        content=message.content
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    db.refresh(new_message, attribute_names=["sender"])
    
    # Kiểm tra xem admin có offline không và có cần gửi email không
    if not is_admin_online(db):
        # Cập nhật thời gian gửi email cuối cùng
        ticket.last_notification_sent_at = datetime.now(timezone.utc)
        db.commit()
        
        # Thêm background task để gửi email
        background_tasks.add_task(
            send_admin_notification_task,
            user_full_name=current_user.full_name,
            user_email=current_user.email,
            ticket_subject=ticket.subject,
            message_content=message.content
        )
    
    return new_message


# ================================
# ADMIN ENDPOINTS (cho quản trị viên)
# ================================

def update_admin_online_status(current_user: User, db: Session):
    """Helper function to update admin's last_online_at"""
    current_user.last_online_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)


@router.get("/admin/tickets", response_model=List[SupportTicketResponse])
def get_all_tickets(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Lấy tất cả tickets (chỉ admin)."""
    update_admin_online_status(current_user, db)
    tickets = db.query(SupportTicket).options(
        joinedload(SupportTicket.user),
        joinedload(SupportTicket.messages)
    ).order_by(SupportTicket.updated_at.desc()).all()
    return tickets


@router.get("/admin/tickets/{ticket_id}", response_model=SupportTicketResponse)
def get_ticket_detail(
    ticket_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Lấy chi tiết ticket (chỉ admin)."""
    update_admin_online_status(current_user, db)
    ticket = db.query(SupportTicket).options(
        joinedload(SupportTicket.user),
        joinedload(SupportTicket.messages).joinedload(SupportMessage.sender)
    ).filter(SupportTicket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket không tồn tại"
        )
    
    return ticket


@router.post("/admin/tickets/{ticket_id}/messages", response_model=SupportMessageResponse, status_code=status.HTTP_201_CREATED)
def admin_send_message(
    ticket_id: int,
    message: SupportMessageCreate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin gửi tin nhắn vào ticket."""
    update_admin_online_status(current_user, db)
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket không tồn tại"
        )
    
    # Cập nhật updated_at của ticket
    ticket.updated_at = datetime.now(timezone.utc)
    
    new_message = SupportMessage(
        ticket_id=ticket_id,
        sender_id=current_user.id,
        content=message.content
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    db.refresh(new_message, attribute_names=["sender"])
    return new_message


@router.patch("/admin/tickets/{ticket_id}/status", response_model=SupportTicketResponse)
def update_ticket_status(
    ticket_id: int,
    status_update: dict,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Cập nhật trạng thái ticket (open, in_progress, closed)."""
    update_admin_online_status(current_user, db)
    new_status = status_update.get("status")
    if new_status not in ["open", "in_progress", "closed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trạng thái không hợp lệ"
        )
    
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket không tồn tại"
        )
    
    ticket.status = new_status
    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)
    db.refresh(ticket, attribute_names=["user"])
    return ticket
