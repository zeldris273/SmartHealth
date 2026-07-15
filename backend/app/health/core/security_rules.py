import re

# Gom Regex và thông báo lỗi về một nơi cho sạch code
EMAIL_DOMAIN_REGEX = r"^[a-zA-Z0-9._%+-]+@(gmail\.com|hutech\.edu\.vn)$"
PASSWORD_STRONG_REGEX = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"

def validate_strong_password(password: str) -> str:
    if not re.match(PASSWORD_STRONG_REGEX, password):
        raise ValueError("Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.")
    return password

def validate_email_domain(email: str) -> str:
    if not re.match(EMAIL_DOMAIN_REGEX, email):
        raise ValueError("Hệ thống chỉ chấp nhận đuôi @gmail.com hoặc @hutech.edu.vn.")
    return email