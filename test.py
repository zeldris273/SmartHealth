from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from openpyxl import Workbook
from datetime import datetime
import time

EMAIL = "sekaikamiki2309@gmail.com"
PASSWORD = "Roti2324@232400"

# =========================
# EXCEL REPORT
# =========================
wb = Workbook()
ws = wb.active
ws.title = "Login Test Report"

ws.append([
    "STT",
    "Test Case",
    "Expected Result",
    "Actual Result",
    "Status",
    "Execution Time"
])

stt = 1

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
driver.get("http://localhost:5173/")
driver.maximize_window()

wait = WebDriverWait(driver, 20)

# =========================
# 1. MỞ LOGIN MODAL
# =========================
print("Opening login modal...")

try:
    login_button = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button"))
    )

    driver.execute_script("arguments[0].click();", login_button)

    ws.append([
        stt,
        "Open Login Modal",
        "Modal opens",
        "Modal opened successfully",
        "PASS",
        datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    ])
    stt += 1

except Exception as e:
    ws.append([
        stt,
        "Open Login Modal",
        "Modal opens",
        str(e),
        "FAIL",
        datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    ])
    wb.save("Login_Test_Report.xlsx")
    driver.quit()
    exit()

# =========================
# 2. REMOVE CHAT BUTTON
# =========================
time.sleep(2)

driver.execute_script("""
document.querySelectorAll('button[aria-label="Mở chat CSKH"]').forEach(e => e.remove());
""")

# =========================
# 3. LOGIN
# =========================
print("Waiting for login form...")

try:
    inputs = wait.until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "input"))
    )

    print(f"Found {len(inputs)} inputs")

    inputs[0].clear()
    inputs[0].send_keys(EMAIL)

    inputs[1].clear()
    inputs[1].send_keys(PASSWORD)

    login_btn = wait.until(
        EC.element_to_be_clickable((
            By.XPATH,
            "//button[contains(., 'Đăng nhập') or contains(., 'Login') or @type='submit']"
        ))
    )

    driver.execute_script("arguments[0].click();", login_btn)

except Exception as e:

    ws.append([
        stt,
        "Input Login",
        "User can login",
        str(e),
        "FAIL",
        datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    ])

    wb.save("Login_Test_Report.xlsx")
    driver.quit()
    exit()

# =========================
# 4. VERIFY LOGIN
# =========================
print("Checking login result...")

time.sleep(5)

current_url = driver.current_url
page = driver.page_source.lower()

if "/dashboard" in current_url or "/profile" in current_url:

    status = "PASS"
    actual = "Redirected to " + current_url

elif "logout" in page or "profile" in page:

    status = "PASS"
    actual = "Logged in successfully"

else:

    status = "FAIL"
    actual = "Login failed"

print(status)

ws.append([
    stt,
    "Login",
    "User logs in successfully",
    actual,
    status,
    datetime.now().strftime("%d/%m/%Y %H:%M:%S")
])

# =========================
# SAVE EXCEL
# =========================
wb.save("Login_Test_Report.xlsx")

print("\n===================================")
print("Excel Report Saved")
print("File: Login_Test_Report.xlsx")
print("===================================")

time.sleep(3)
driver.quit()