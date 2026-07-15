
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timezone, timedelta

from database import SessionLocal, get_db
from app.health.core.config import settings
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


class SupportConnectionManager:
    def __init__(self):
        self.active_connections: dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket, user: User):
        await websocket.accept()
        self.active_connections[websocket] = {
            "user_id": user.id,
            "role": user.role,
        }

    def disconnect(self, websocket: WebSocket):
        self.active_connections.pop(websocket, None)

    def has_admin_online(self) -> bool:
        return any(
            connection["role"] == "admin"
            for connection in self.active_connections.values()
        )

    def has_user_connection(self, user_id: int) -> bool:
        return any(
            connection["user_id"] == user_id
            for connection in self.active_connections.values()
        )

    async def send_json(self, websocket: WebSocket, payload: dict):
        try:
            await websocket.send_json(payload)
        except RuntimeError:
            self.disconnect(websocket)

    async def send_to_admins(self, payload: dict):
        for websocket, connection in list(self.active_connections.items()):
            if connection["role"] == "admin":
                await self.send_json(websocket, payload)

    async def send_to_user(self, user_id: int, payload: dict):
        for websocket, connection in list(self.active_connections.items()):
            if connection["user_id"] == user_id:
                await self.send_json(websocket, payload)

    async def broadcast_admin_status(self):
        payload = {
            "type": "admin_status",
            "is_admin_online": self.has_admin_online(),
        }
        for websocket in list(self.active_connections.keys()):
            await self.send_json(websocket, payload)


support_ws_manager = SupportConnectionManager()


def get_user_from_token(token: str, db: Session) -> User | None:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        return None

    return db.query(User).filter(User.id == user_id).first()


def get_admin_emails(db: Session) -> list[str]:
    return [
        admin.email
        for admin in db.query(User.email).filter(User.role == "admin").all()
        if admin.email
    ]


async def broadcast_ticket_event(ticket: SupportTicket, event_type: str, sender_id: int = None):
    payload = {
        "type": event_type,
        "ticket_id": ticket.id,
        "user_id": ticket.user_id,
        "status": ticket.status,
    }
    if sender_id is not None:
        payload["sender_id"] = sender_id
    await support_ws_manager.send_to_admins(payload)
    await support_ws_manager.send_to_user(ticket.user_id, payload)


def is_admin_online(db: Session) -> bool:
    """Kiểm tra admin CSKH online theo WebSocket realtime."""
    return support_ws_manager.has_admin_online()


def send_admin_notification_task(
    admin_emails: list[str],
    user_full_name: str,
    user_email: str,
    ticket_subject: str,
    message_content: str
):
    """Background task để gửi email thông báo cho admin"""
    try:
        if not admin_emails:
            return
        
        EmailService.send_admin_notification_email(
            admin_emails=admin_emails,
            user_full_name=user_full_name,
            user_email=user_email,
            ticket_subject=ticket_subject,
            message_content=message_content
        )
    except Exception as e:
        import logging
        logging.error(f"Error sending admin notification email: {e}")


@router.websocket("/ws")
async def support_websocket(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    db = SessionLocal()
    user = get_user_from_token(token, db)
    if not user:
        db.close()
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        if user.role == "admin":
            user.last_online_at = datetime.now(timezone.utc)
            db.commit()

        await support_ws_manager.connect(websocket, user)
        await support_ws_manager.send_json(websocket, {
            "type": "admin_status",
            "is_admin_online": support_ws_manager.has_admin_online(),
        })

        if user.role == "admin":
            await support_ws_manager.broadcast_admin_status()

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        support_ws_manager.disconnect(websocket)
        if user.role == "admin" and not support_ws_manager.has_user_connection(user.id):
            user.last_online_at = datetime.now(timezone.utc) - timedelta(hours=1)
            db.commit()
        if user.role == "admin":
            await support_ws_manager.broadcast_admin_status()
        db.close()


# ================================
# USER ENDPOINTS (cho người dùng)
# ================================

@router.post("/tickets", response_model=SupportTicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
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
    await broadcast_ticket_event(new_ticket, "ticket_created", sender_id=current_user.id)
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
async def send_message_to_ticket(
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
    
    # Kiểm tra xem có cần gửi email không
    now = datetime.now(timezone.utc)
    # Cooldown 30 giây để test nhanh
    cooldown_minutes = 0.5
    should_send_email = False
    
    # Lấy danh sách admin và kiểm tra preference của họ
    admins = db.query(User).filter(User.role == "admin").all()
    print(f"[DEBUG] Found {len(admins)} admins")
    for admin in admins:
        print(f"[DEBUG] Admin {admin.email}: email_notification_enabled={admin.email_notification_enabled}")
    
    admin_is_online = is_admin_online(db)
    print(f"[DEBUG] Admin online status: {admin_is_online}")
    
    if not admin_is_online:
        # Admin offline: luôn gửi email cho tất cả admin
        should_send_email = True
        print(f"[DEBUG] Admin offline, should_send_email=True")
    else:
        # Admin online: kiểm tra xem có admin nào bật email_notification_enabled không
        has_enabled_admin = any(admin.email_notification_enabled for admin in admins)
        print(f"[DEBUG] Has enabled admin: {has_enabled_admin}")
        if has_enabled_admin:
            # Kiểm tra cooldown
            time_since_last_notification = None
            if ticket.last_notification_sent_at:
                time_since_last_notification = (now - ticket.last_notification_sent_at).total_seconds()
            print(f"[DEBUG] Time since last notification: {time_since_last_notification} seconds")
            if (not ticket.last_notification_sent_at or 
                time_since_last_notification > cooldown_minutes * 60):
                should_send_email = True
                print(f"[DEBUG] Cooldown passed, should_send_email=True")
    
    if should_send_email:
        # Cập nhật thời gian gửi email cuối cùng
        ticket.last_notification_sent_at = now
        db.commit()
        
        # Xác định danh sách admin để gửi email
        if not admin_is_online:
            # Admin offline: gửi cho tất cả admin có email
            admin_emails = [admin.email for admin in admins if admin.email]
            print(f"[DEBUG] Admin offline, sending to all admins: {admin_emails}")
        else:
            # Admin online: chỉ gửi cho admin nào bật email_notification_enabled = True
            admin_emails = [admin.email for admin in admins if admin.email and admin.email_notification_enabled]
            print(f"[DEBUG] Admin online, sending to enabled admins: {admin_emails}")
        
        if admin_emails:
            # Thêm background task để gửi email
            background_tasks.add_task(
                send_admin_notification_task,
                admin_emails=admin_emails,
                user_full_name=current_user.full_name,
                user_email=current_user.email,
                ticket_subject=ticket.subject,
                message_content=message.content
            )
    
    await broadcast_ticket_event(ticket, "message_created", sender_id=current_user.id)
    return new_message


# ================================
# ADMIN ENDPOINTS (cho quản trị viên)
# ================================

@router.get("/admin/unread-count", response_model=int)
def get_unread_count(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Lấy tổng số tin nhắn chưa đọc từ người dùng."""
    # Đếm tất cả tin nhắn từ user (sender_id != admin) mà có ID > last_admin_read_message_id
    # Hoặc tất cả tin nhắn từ user nếu chưa có last_admin_read_message_id
    unread_count = 0
    
    # Lấy tất cả tickets không đóng
    active_tickets = db.query(SupportTicket).filter(
        SupportTicket.status.in_(["open", "in_progress"])
    ).all()
    
    for ticket in active_tickets:
        # Lấy tất cả tin nhắn từ user chưa được xem
        query = db.query(SupportMessage).filter(
            SupportMessage.ticket_id == ticket.id,
            SupportMessage.sender_id != current_user.id
        )
        
        if ticket.last_admin_read_message_id:
            query = query.filter(SupportMessage.id > ticket.last_admin_read_message_id)
        
        unread_count += query.count()
    
    return unread_count


@router.post("/admin/tickets/{ticket_id}/mark-read", response_model=SupportTicketResponse)
def mark_ticket_as_read(
    ticket_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Đánh dấu ticket đã đọc đến tin nhắn cuối cùng."""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket không tồn tại"
        )
    
    # Lấy tin nhắn cuối cùng
    latest_message = db.query(SupportMessage).filter(
        SupportMessage.ticket_id == ticket_id
    ).order_by(SupportMessage.created_at.desc(), SupportMessage.id.desc()).first()
    
    if latest_message:
        ticket.last_admin_read_message_id = latest_message.id
        ticket.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(ticket)
    
    # Load relationships
    ticket = db.query(SupportTicket).options(
        joinedload(SupportTicket.user),
        joinedload(SupportTicket.messages).joinedload(SupportMessage.sender)
    ).filter(SupportTicket.id == ticket_id).first()
    
    return ticket


@router.get("/admin/tickets", response_model=List[SupportTicketResponse])
def get_all_tickets(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Lấy tất cả tickets (chỉ admin)."""
    tickets = db.query(SupportTicket).options(
        joinedload(SupportTicket.user),
        joinedload(SupportTicket.messages)
    ).order_by(SupportTicket.updated_at.desc()).all()
    
    # Thêm thông tin unread cho mỗi ticket
    for ticket in tickets:
        # Đếm số tin nhắn từ user chưa được xem trong ticket này
        query = db.query(SupportMessage).filter(
            SupportMessage.ticket_id == ticket.id,
            SupportMessage.sender_id != current_user.id
        )
        
        if ticket.last_admin_read_message_id:
            query = query.filter(SupportMessage.id > ticket.last_admin_read_message_id)
        
        ticket._unread_messages_count = query.count()
    
    return tickets


@router.get("/admin/tickets/{ticket_id}", response_model=SupportTicketResponse)
def get_ticket_detail(
    ticket_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Lấy chi tiết ticket (chỉ admin)."""
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
async def admin_send_message(
    ticket_id: int,
    message: SupportMessageCreate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin gửi tin nhắn vào ticket."""
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
    # Tự động đánh dấu ticket đã đọc khi admin trả lời
    ticket.last_admin_read_message_id = new_message.id
    db.commit()
    
    await broadcast_ticket_event(ticket, "message_created", sender_id=current_user.id)
    return new_message


@router.patch("/admin/tickets/{ticket_id}/status", response_model=SupportTicketResponse)
async def update_ticket_status(
    ticket_id: int,
    status_update: dict,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Cập nhật trạng thái ticket (open, in_progress, closed)."""
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
    await broadcast_ticket_event(ticket, "ticket_status_updated", sender_id=current_user.id)
    return ticket
