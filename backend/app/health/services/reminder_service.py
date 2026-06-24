from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.health.models.user import User
from app.health.services.email_service import EmailService
from app.health.core.config import settings

class ReminderService:
    @staticmethod
    def process_bmi_reminders(db: Session):
        """
        Quét toàn bộ người dùng và gửi email nhắc nhở cập nhật BMI 
        dựa trên tần suất họ đã cài đặt.
        """
        # Lấy tất cả người dùng đã bật thông báo nhắc nhở
        users = db.query(User).filter(User.bmi_reminder_enabled == True).all()
        
        now = datetime.now(timezone.utc)
        sent_count = 0

        for user in users:
            # Xác định khoảng thời gian cần thiết dựa trên tần suất (daily hoặc weekly)
            if user.bmi_reminder_frequency == "daily":
                delta = timedelta(days=1)
            else: # mặc định là weekly
                delta = timedelta(days=7)

            # Kiểm tra xem đã đến lúc gửi nhắc nhở chưa
            # Nếu chưa từng gửi hoặc thời gian từ lần gửi cuối > delta
            if user.last_notification_sent_at is None or (now - user.last_notification_sent_at) >= delta:
                try:
                    # Gửi email nhắc nhở
                    # dashboard_url sẽ là link dẫn tới trang dashboard của user
                    dashboard_url = f"{settings.FRONTEND_URL}/dashboard"
                    
                    EmailService.send_bmi_reminder_email(
                        to_email=user.email,
                        full_name=user.full_name,
                        dashboard_url=dashboard_url
                    )
                    
                    # Cập nhật thời gian gửi cuối cùng
                    user.last_notification_sent_at = now
                    sent_count += 1
                except Exception as e:
                    print(f"Error sending BMI reminder to {user.email}: {str(e)}")

        db.commit()
        print(f"BMI Reminder Job: Sent {sent_count} reminder emails.")
        return sent_count