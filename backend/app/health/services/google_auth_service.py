from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from fastapi import HTTPException, status
# Đảm bảo import đúng đường dẫn settings của Lạc nha
from app.health.core.config import settings 

class GoogleAuthService:

    @staticmethod
    def verify_google_token(token: str) -> dict:
        """
        Xác thực ID Token nhận từ Frontend với Google API Server.
        Trả về một dict chứa toàn bộ thông tin profile của User (email, name, picture, sub...)
        """
        try:
            # Gọi thư viện Google để kiểm tra tính hợp lệ của token
            id_info = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )
            return id_info
            
        except ValueError:
            # Nếu token là hàng giả, hàng nhái hoặc đã hết hạn, thư viện sẽ quăng ValueError
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Mã xác thực Google (ID Token) không hợp lệ hoặc đã hết hạn."
            )