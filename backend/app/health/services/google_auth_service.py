import base64
import json
import logging

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from fastapi import HTTPException, status

from app.health.core.config import settings

logger = logging.getLogger(__name__)


def _decode_jwt_payload(token: str) -> dict | None:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        payload = parts[1]
        padding = "=" * (-len(payload) % 4)
        return json.loads(base64.urlsafe_b64decode(payload + padding))
    except (json.JSONDecodeError, ValueError, TypeError):
        return None


def _audience_matches(id_info: dict, expected_client_id: str) -> bool:
    aud = id_info.get("aud")
    azp = id_info.get("azp")
    if isinstance(aud, list):
        return expected_client_id in aud or azp == expected_client_id
    return aud == expected_client_id or azp == expected_client_id


class GoogleAuthService:

    @staticmethod
    def verify_google_token(token: str) -> dict:
        """
        Xác thực ID Token nhận từ Frontend với Google API Server.
        Trả về một dict chứa toàn bộ thông tin profile của User (email, name, picture, sub...)
        """
        if not settings.GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GOOGLE_CLIENT_ID chưa được cấu hình trên server.",
            )

        token = (token or "").strip()
        if not token or token.count(".") != 2:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Mã xác thực Google (ID Token) không hợp lệ hoặc đã hết hạn.",
            )

        expected_client_id = settings.GOOGLE_CLIENT_ID.strip()

        try:
            id_info = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                audience=None,
                clock_skew_in_seconds=60,
            )
        except ValueError as exc:
            logger.warning("Google ID token verification failed: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Mã xác thực Google (ID Token) không hợp lệ hoặc đã hết hạn.",
            ) from exc

        if id_info.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Mã xác thực Google (ID Token) không hợp lệ hoặc đã hết hạn.",
            )

        if not _audience_matches(id_info, expected_client_id):
            payload = _decode_jwt_payload(token) or {}
            token_aud = payload.get("aud") or payload.get("azp")
            logger.warning(
                "Google token audience mismatch: token_aud=%s expected=%s",
                token_aud,
                expected_client_id,
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    "Client ID Google không khớp giữa frontend và backend. "
                    "Kiểm tra VITE_GOOGLE_CLIENT_ID và GOOGLE_CLIENT_ID phải cùng một OAuth Web Client ID."
                ),
            )

        return id_info
