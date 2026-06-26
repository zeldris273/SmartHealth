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

driver.get("http://localhost:5173/")
driver.maximize_window()

# =========================
# 1. LOGIN
# =========================
print("LOGIN...")

login_btn = wait.until(
    EC.element_to_be_clickable((By.CSS_SELECTOR, "button"))
)
driver.execute_script("arguments[0].click();", login_btn)

time.sleep(2)

inputs = wait.until(
    EC.presence_of_all_elements_located((By.CSS_SELECTOR, "input"))
)

inputs[0].clear()
inputs[0].send_keys(EMAIL)

inputs[1].clear()
inputs[1].send_keys(PASSWORD)

submit = wait.until(
    EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Đăng nhập') or @type='submit']"))
)
driver.execute_script("arguments[0].click();", submit)

time.sleep(4)
print("Login OK:", driver.current_url)

# =========================
# 2. DASHBOARD
# =========================
driver.get("http://localhost:5173/dashboard")
time.sleep(3)

# =========================
# 3. BMI TEST
# =========================
print("TEST BMI...")

inputs = driver.find_elements(By.CSS_SELECTOR, "input")

if len(inputs) >= 3:
    inputs[0].clear()
    inputs[0].send_keys("25")    # AGE

    inputs[1].clear()
    inputs[1].send_keys("170")   # HEIGHT

    inputs[2].clear()
    inputs[2].send_keys("75")    # WEIGHT

    print("BMI inputs filled")
else:
    print("❌ BMI inputs not found")

for b in driver.find_elements(By.TAG_NAME, "button"):
    if "bmi" in b.text.lower() or "calculate" in b.text.lower() or "tính" in b.text.lower():
        driver.execute_script("arguments[0].click();", b)
        break

time.sleep(3)

# =========================
# 4. CALORIES
# =========================
print("TEST CALORIES...")

for b in driver.find_elements(By.TAG_NAME, "button"):
    if "cal" in b.text.lower() or "calories" in b.text.lower():
        driver.execute_script("arguments[0].click();", b)
        break

time.sleep(2)

# =========================
# 5. HEALTH TIPS
# =========================
print("TEST HEALTH TIPS...")

try:
    wait.until(
        EC.presence_of_element_located((
            By.XPATH,
            "//*[contains(text(),'tip') or contains(text(),'lời khuyên') or contains(text(),'exercise') or contains(text(),'diet')]"
        ))
    )
    print("✅ HEALTH TIPS VISIBLE")
except:
    print("❌ HEALTH TIPS NOT FOUND")

# =========================
# 6. PERSONAL HEALTH SUGGESTION
# =========================
print("TEST PERSONAL HEALTH SUGGESTION...")

try:
    suggestion_btn = wait.until(
        EC.element_to_be_clickable((
            By.XPATH,
            "//button[contains(., 'Nhận gợi ý sức khỏe') or contains(., 'gợi ý sức khỏe')]"
        ))
    )

    driver.execute_script("arguments[0].click();", suggestion_btn)
    print("Clicked suggestion button")

    time.sleep(3)

    wait.until(
        EC.presence_of_element_located((
            By.XPATH,
            "//*[contains(text(),'khuyến nghị') or contains(text(),'gợi ý') or contains(text(),'recommend')]"
        ))
    )

    print("✅ PERSONAL HEALTH SUGGESTION VISIBLE")

except:
    print("❌ PERSONAL HEALTH SUGGESTION NOT FOUND")

# =========================
# 7. WEIGHT GOALS (FIXED CLICK)
# =========================
print("TEST WEIGHT GOALS (GIẢM / TĂNG CÂN)...")

time.sleep(3)

# GIẢM CÂN
try:
    giam_can_btn = wait.until(
        EC.element_to_be_clickable((
            By.XPATH,
            "//button[contains(text(),'Giảm cân')]"
        ))
    )
    driver.execute_script("arguments[0].click();", giam_can_btn)
    print("✅ CLICKED: GIẢM CÂN")
except:
    print("❌ GIẢM CÂN NOT FOUND / NOT CLICKABLE")

time.sleep(1)

# TĂNG CÂN
try:
    tang_can_btn = wait.until(
        EC.element_to_be_clickable((
            By.XPATH,
            "//button[contains(text(),'Tăng cân')]"
        ))
    )
    driver.execute_script("arguments[0].click();", tang_can_btn)
    print("✅ CLICKED: TĂNG CÂN")
except:
    print("❌ TĂNG CÂN NOT FOUND / NOT CLICKABLE")

# =========================
# 8. FINAL
# =========================
print("\n====================")
print("TEST DONE")
print("====================")

time.sleep(3)
driver.quit()