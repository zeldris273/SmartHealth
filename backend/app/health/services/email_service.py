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
