from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time

EMAIL = "sekaikamiki2309@gmail.com"
PASSWORD = "Roti2324@232400"

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
driver.get("http://localhost:5173/")
driver.maximize_window()

wait = WebDriverWait(driver, 20)

# =========================
# 1. MỞ LOGIN MODAL
# =========================
print("Opening login modal...")

login_button = wait.until(
    EC.element_to_be_clickable((By.CSS_SELECTOR, "button"))
)

driver.execute_script("arguments[0].click();", login_button)

# =========================
# 2. CHỜ MODAL + XOÁ OVERLAY CSKH (TRÁNH CLICK INTERCEPTED)
# =========================
print("Waiting for login form...")

time.sleep(2)

driver.execute_script("""
document.querySelectorAll('button[aria-label="Mở chat CSKH"]').forEach(e => e.remove());
""")

# =========================
# 3. CHỜ INPUT LOGIN
# =========================
inputs = wait.until(
    EC.presence_of_all_elements_located((By.CSS_SELECTOR, "input"))
)

print(f"Found {len(inputs)} inputs")

if len(inputs) < 2:
    print("❌ Not enough inputs found!")
    driver.quit()
    exit()

# =========================
# 4. NHẬP EMAIL / PASSWORD
# =========================
inputs[0].clear()
inputs[0].send_keys(EMAIL)

inputs[1].clear()
inputs[1].send_keys(PASSWORD)

# =========================
# 5. CLICK LOGIN BUTTON (CHÍNH XÁC TRONG MODAL)
# =========================
print("Clicking login...")

login_btn = wait.until(
    EC.element_to_be_clickable((
        By.XPATH,
        "//button[contains(., 'Đăng nhập') or contains(., 'Login') or @type='submit']"
    ))
)

driver.execute_script("arguments[0].click();", login_btn)

# =========================
# 6. VERIFY LOGIN SUCCESS
# =========================
print("Checking login result...")

time.sleep(5)

current_url = driver.current_url
print("Current URL:", current_url)

if "/dashboard" in current_url or "/profile" in current_url:
    print("✅ LOGIN SUCCESS (URL changed)")
else:
    page = driver.page_source.lower()

    if "logout" in page or "profile" in page:
        print("✅ LOGIN SUCCESS (UI detected)")
    else:
        print("❌ LOGIN FAILED")

# =========================
# 7. CLOSE
# =========================
time.sleep(3)
driver.quit()