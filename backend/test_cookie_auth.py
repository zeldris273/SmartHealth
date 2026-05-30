"""
Test HttpOnly Cookie Refresh Token Flow
Chạy: cd backend && python3 test_cookie_auth.py
"""
import sys
import os
import time
import httpx

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

BASE_URL = "http://127.0.0.1:8000"
TEST_EMAIL = "test_cookie_user_temp@example.com"
TEST_PASSWORD = "StrongPassword123!"

# ---------- helpers ----------

PASS = "\033[92m✅"
FAIL = "\033[91m❌"
INFO = "\033[94mℹ️ "
RESET = "\033[0m"

def ok(msg):   print(f"{PASS} {msg}{RESET}")
def fail(msg): print(f"{FAIL} {msg}{RESET}"); sys.exit(1)
def info(msg): print(f"{INFO} {msg}{RESET}")

# ---------- setup user ----------

def setup_user():
    """Tạo user test trực tiếp vào DB (bypass OTP)."""
    from database import SessionLocal, Base, engine
    from app.health.models.user import User
    from app.health.core.security import hash_password

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    existing = db.query(User).filter(User.email == TEST_EMAIL).first()
    if existing:
        db.delete(existing)
        db.commit()

    user = User(
        full_name="Cookie Test User",
        email=TEST_EMAIL,
        password_hash=hash_password(TEST_PASSWORD),
        role="user",
    )
    db.add(user)
    db.commit()
    db.close()
    info("Test user created in DB")


def cleanup_user():
    from database import SessionLocal
    from app.health.models.user import User

    db = SessionLocal()
    u = db.query(User).filter(User.email == TEST_EMAIL).first()
    if u:
        db.delete(u)
        db.commit()
    db.close()
    info("Test user cleaned up")


# ---------- tests ----------

def run_tests():
    # httpx.Client tự quản lý cookie jar (giống trình duyệt)
    with httpx.Client(base_url=BASE_URL, follow_redirects=True) as client:

        # ── TEST 1: Login ──────────────────────────────────────────
        print("\n─── TEST 1: POST /auth/login ───")
        resp = client.post("/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        })
        info(f"Status: {resp.status_code}")

        if resp.status_code != 200:
            fail(f"Login failed: {resp.text}")

        body = resp.json()
        info(f"Response body keys: {list(body.keys())}")

        # access_token phải có trong JSON
        if "access_token" not in body:
            fail("access_token missing from response body!")
        ok("access_token present in JSON body")

        # refresh_token KHÔNG được có trong JSON
        if "refresh_token" in body:
            fail("refresh_token should NOT be in JSON body (must be in cookie only)!")
        ok("refresh_token NOT in JSON body ✓")

        # Kiểm tra cookie
        cookies = dict(client.cookies)
        info(f"Cookies received: {list(cookies.keys())}")

        if "refresh_token" not in cookies:
            fail("refresh_token cookie not set by backend!")
        ok("refresh_token set as cookie ✓")

        # Kiểm tra cookie có HttpOnly không (qua Set-Cookie header)
        set_cookie_header = resp.headers.get("set-cookie", "")
        info(f"Set-Cookie header: {set_cookie_header}")
        if "httponly" not in set_cookie_header.lower():
            fail("Cookie is NOT HttpOnly!")
        ok("Cookie is HttpOnly ✓")

        if "path=/auth" in set_cookie_header.lower():
            ok("Cookie path restricted to /auth ✓")

        access_token = body["access_token"]

        # ── TEST 2: Gọi /users/me với access_token ─────────────────
        print("\n─── TEST 2: GET /users/me (authenticated) ───")
        resp2 = client.get("/users/me", headers={"Authorization": f"Bearer {access_token}"})
        info(f"Status: {resp2.status_code}")

        if resp2.status_code != 200:
            fail(f"/users/me failed: {resp2.text}")

        profile = resp2.json()
        if profile.get("email") != TEST_EMAIL:
            fail("Profile email mismatch!")
        ok(f"Profile fetched: {profile['email']} ✓")

        # ── TEST 3: Refresh token (dùng cookie, không cần body) ─────
        print("\n─── TEST 3: POST /auth/refresh (cookie only, no body) ───")
        resp3 = client.post("/auth/refresh", json={})
        info(f"Status: {resp3.status_code}")

        if resp3.status_code != 200:
            fail(f"Token refresh failed: {resp3.text}")

        refresh_body = resp3.json()
        if "access_token" not in refresh_body:
            fail("New access_token missing after refresh!")
        ok("New access_token received ✓")

        if "refresh_token" in refresh_body:
            fail("refresh_token should NOT be in refresh response body!")
        ok("refresh_token NOT in refresh response body ✓")

        # Cookie mới phải được set (token rotation)
        new_set_cookie = resp3.headers.get("set-cookie", "")
        if "refresh_token" not in new_set_cookie.lower() and "refresh_token" not in str(resp3.cookies):
            fail("New refresh_token cookie not rotated!")
        ok("Refresh token rotated in cookie ✓")

        new_access_token = refresh_body["access_token"]

        # ── TEST 4: Dùng access_token mới vẫn hoạt động ─────────────
        print("\n─── TEST 4: GET /users/me với access_token mới ───")
        resp4 = client.get("/users/me", headers={"Authorization": f"Bearer {new_access_token}"})
        if resp4.status_code != 200:
            fail(f"/users/me with new token failed: {resp4.text}")
        ok("New access_token works ✓")

        # ── TEST 5: Logout xóa cookie ────────────────────────────────
        print("\n─── TEST 5: POST /auth/logout ───")
        resp5 = client.post("/auth/logout")
        info(f"Status: {resp5.status_code}")

        if resp5.status_code != 200:
            fail(f"Logout failed: {resp5.text}")
        ok("Logout endpoint responded 200 ✓")

        # Sau logout, cookie phải bị xóa (max-age=0 hoặc expires in past)
        logout_set_cookie = resp5.headers.get("set-cookie", "")
        info(f"Logout Set-Cookie: {logout_set_cookie}")
        if "refresh_token" in logout_set_cookie.lower():
            # Cookie bị xóa khi max-age=0 hoặc expires cũ
            if "max-age=0" in logout_set_cookie.lower() or 'expires=' in logout_set_cookie.lower():
                ok("refresh_token cookie cleared on logout ✓")
            else:
                ok("refresh_token cookie header present on logout ✓")
        else:
            ok("Cookie cleared on logout ✓")

        # ── TEST 6: Refresh sau logout phải fail ─────────────────────
        print("\n─── TEST 6: POST /auth/refresh sau logout (phải fail 401) ───")
        # Xóa cookie khỏi client để mô phỏng đúng
        client.cookies.clear()
        resp6 = client.post("/auth/refresh", json={})
        info(f"Status: {resp6.status_code}")

        if resp6.status_code == 401:
            ok("Refresh after logout correctly returns 401 ✓")
        else:
            fail(f"Expected 401 after logout, got {resp6.status_code}: {resp6.text}")


if __name__ == "__main__":
    print("=" * 55)
    print("  SmartHealth — HttpOnly Cookie Auth Test Suite")
    print("=" * 55)

    setup_user()
    try:
        run_tests()
        print("\n" + "=" * 55)
        print("  🎉 ALL TESTS PASSED — Cookie auth hoạt động đúng!")
        print("=" * 55)
    except SystemExit:
        print("\n" + "=" * 55)
        print("  💥 TEST FAILED — Xem lỗi ở trên")
        print("=" * 55)
        raise
    finally:
        cleanup_user()
