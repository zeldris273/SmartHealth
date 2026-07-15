from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
import httpx
import urllib.parse

from app.health.core.config import settings
from app.health.core.security import create_access_token, create_refresh_token
from app.health.models.user import User
from app.health.models.oauth_token import OAuthToken
from database import get_db

router = APIRouter(prefix="/auth/google", tags=["Google OAuth"])

# Step 1: redirect user to Google consent screen
@router.get("/login")
def google_oauth_login():
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    return Response(status_code=status.HTTP_307_TEMPORARY_REDIRECT, headers={"Location": url})

# Step 2: Google redirects back with ?code=...
@router.get("/callback")
async def google_oauth_callback(request: Request, response: Response, db: Session = Depends(get_db)):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing authorization code")

    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(token_url, data=data, timeout=10)
    if token_resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Failed to exchange code for token")
    token_data = token_resp.json()
    id_token = token_data.get("id_token")
    refresh_token = token_data.get("refresh_token")
    if not id_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="ID token missing")

    # Verify ID token & get user info
    from app.health.services.google_auth_service import GoogleAuthService
    id_info = GoogleAuthService.verify_google_token(id_token)
    email = id_info.get("email")
    google_id = id_info.get("sub")
    full_name = id_info.get("name", "Google User")
    avatar_url = id_info.get("picture")

    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, full_name=full_name, google_id=google_id, avatar_url=avatar_url, auth_provider="google", password_hash=None)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.google_id = google_id
        # Only update avatar from Google if user doesn't have one already
        if not user.avatar_url:
            user.avatar_url = avatar_url
        user.auth_provider = "google"
        db.commit()

    # Store refresh token (if provided)
    if refresh_token:
        oauth_entry = db.query(OAuthToken).filter(OAuthToken.user_id == user.id, OAuthToken.provider == "google").first()
        if oauth_entry:
            oauth_entry.refresh_token = refresh_token
        else:
            oauth_entry = OAuthToken(user_id=user.id, provider="google", refresh_token=refresh_token)
            db.add(oauth_entry)
        db.commit()

    access_token = create_access_token(subject=str(user.id), role=user.role)
    # Return tokens in JSON (frontend can set cookie if desired)
    return {"access_token": access_token, "token_type": "bearer"}
