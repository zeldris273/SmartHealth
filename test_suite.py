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
wait = WebDriverWait(driver, 20)

BASE_URL = "http://localhost:5173"

# =========================
# UTILS
# =========================
def log(msg):
    print("\n====================")
    print(msg)
    print("====================\n")

def click(xpath):
    el = wait.until(EC.element_to_be_clickable((By.XPATH, xpath)))
    driver.execute_script("arguments[0].click();", el)
    return el

def safe_get(url):
    driver.get(url)
    time.sleep(2)

# =========================
# 1. OPEN HOME
# =========================
log("TEST 1: OPEN HOME PAGE")

safe_get(BASE_URL)

if "Smart Health" in driver.title:
    print("✅ Home loaded")
else:
    print("❌ Home failed")

# =========================
# 2. OPEN LOGIN MODAL
# =========================
log("TEST 2: OPEN LOGIN MODAL")

login_btn = wait.until(
    EC.element_to_be_clickable((By.CSS_SELECTOR, "button"))
)
driver.execute_script("arguments[0].click();", login_btn)

time.sleep(2)

inputs = wait.until(
    EC.presence_of_all_elements_located((By.CSS_SELECTOR, "input"))
)

if len(inputs) >= 2:
    print("✅ Login modal opened")
else:
    print("❌ Login modal failed")

# =========================
# 3. LOGIN
# =========================
log("TEST 3: LOGIN FUNCTION")

inputs[0].clear()
inputs[0].send_keys(EMAIL)

inputs[1].clear()
inputs[1].send_keys(PASSWORD)

click("//button[contains(., 'Đăng nhập') or @type='submit']")

time.sleep(4)

if "/dashboard" in driver.current_url or "/profile" in driver.current_url:
    print("✅ Login success")
else:
    print("⚠️ Login state unclear")

# =========================
# 4. TEST NAVIGATION
# =========================
log("TEST 4: NAVIGATION TEST")

pages = [
    ("/dashboard", "Dashboard"),
    ("/profile", "Profile"),
    ("/chat", "Chat"),
]

for path, name in pages:
    safe_get(BASE_URL + path)
    if name.lower() in driver.page_source.lower():
        print(f"✅ {name} page OK")
    else:
        print(f"⚠️ {name} may require auth or failed")

# =========================
# 5. TEST HEADER UI
# =========================
log("TEST 5: HEADER ELEMENTS")

safe_get(BASE_URL)

header_checks = [
    "//header",
    "//button"
]

for x in header_checks:
    try:
        driver.find_element(By.XPATH, x)
        print(f"✅ Found: {x}")
    except:
        print(f"❌ Missing: {x}")

# =========================
# 6. TEST CSKH WIDGET EXISTS
# =========================
log("TEST 6: CSKH WIDGET")

if "Mở chat CSKH" in driver.page_source:
    print("✅ CSKH widget exists")
else:
    print("⚠️ CSKH widget not found")

# =========================
# 7. PERFORMANCE CHECK (basic)
# =========================
log("TEST 7: BASIC LOAD CHECK")

start = time.time()
driver.get(BASE_URL)
end = time.time()

print(f"Page load time: {end - start:.2f}s")

# =========================
# FINISH
# =========================
log("ALL TEST DONE")

time.sleep(3)
driver.quit()