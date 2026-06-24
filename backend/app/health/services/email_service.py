import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

from app.health.core.config import settings 

# 1. Định vị vị trí của chính file email_service.py hiện tại
current_file = Path(__file__).resolve()

# 2. Đi ngược lên 2 cấp (services -> health) rồi trỏ vào thư mục templates của Lạc
TEMPLATE_PATH = current_file.parent.parent / "templates"

# 3. Nạp đường dẫn chuẩn vào Jinja2 để đọc file HTML
env = Environment(loader=FileSystemLoader(str(TEMPLATE_PATH)))

class EmailService:
    @staticmethod
    def send_otp_email(to_email: str, otp_code: str) -> None:
        # 1. Đọc file otp_email.html và nạp các biến động vào giao diện
        template = env.get_template("otp_email.html")
        html_content = template.render(
            full_name=to_email.split("@")[0],  # Lấy vế trước chữ @ của email làm tên tạm thời
            otp_code=otp_code
        )

        # 2. Khởi tạo cấu trúc gói tin Email
        message = MIMEMultipart("alternative")
        message["Subject"] = f"[{settings.SMTP_FROM_NAME}] Mã Xác Thực OTP"
        
        # Người gửi hiển thị tên hệ thống và email của Lạc cấu hình trong .env
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        message["To"] = to_email
        
        # Đính kèm nội dung HTML đã được render từ template vào mail
        message.attach(MIMEText(html_content, "html", "utf-8"))

        # 3. Tiến hành kết nối "bưu điện" Google để bắn mail đi
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()  # Kích hoạt mã hóa bảo mật đường truyền TLS
            server.ehlo()
            server.login(
                settings.SMTP_USER,
                settings.SMTP_PASSWORD,
            )
            server.send_message(message)
    
    @staticmethod
    def send_admin_notification_email(
        admin_emails: list[str],
        user_full_name: str,
        user_email: str,
        ticket_subject: str,
        message_content: str
    ) -> None:
        """Gửi email thông báo đến admin khi có tin nhắn mới từ user và admin offline."""
        print("=== EmailService.send_admin_notification_email starting ===")
        print(f"SMTP_USER: {settings.SMTP_USER}")
        print(f"ADMIN_EMAILS: {admin_emails}")
        if not admin_emails:
            return
        
        template = env.get_template("admin_notification_email.html")
        html_content = template.render(
            user_full_name=user_full_name,
            user_email=user_email,
            ticket_subject=ticket_subject,
            message_content=message_content
        )

        message = MIMEMultipart("alternative")
        message["Subject"] = f"[{settings.SMTP_FROM_NAME}] 🔔 Tin nhắn mới từ {user_full_name}"
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        message["To"] = ", ".join(admin_emails)
        
        print(f"Email to: {admin_emails}, subject: {message['Subject']}")
        
        message.attach(MIMEText(html_content, "html", "utf-8"))

        print("Connecting to SMTP server...")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            print("EHLO done")
            server.starttls()
            print("STARTTLS done")
            server.ehlo()
            print("Second EHLO done")
            print("Logging in to SMTP server...")
            server.login(
                settings.SMTP_USER,
                settings.SMTP_PASSWORD,
            )
            print("Login done, sending message...")
            server.send_message(message)
            print("Message sent!")

    @staticmethod
    def send_bmi_reminder_email(to_email: str, full_name: str, dashboard_url: str) -> None:
        """Gửi email nhắc nhở người dùng cập nhật BMI."""
        template = env.get_template("bmi_reminder_email.html")
        html_content = template.render(
            full_name=full_name,
            dashboard_url=dashboard_url
        )

        message = MIMEMultipart("alternative")
        message["Subject"] = f"[{settings.SMTP_FROM_NAME}] 🌿 Nhắc nhở cập nhật chỉ số BMI"
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        message["To"] = to_email
        message.attach(MIMEText(html_content, "html", "utf-8"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
