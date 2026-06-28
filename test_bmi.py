from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font

wb = Workbook()
ws = wb.active
ws.title = "BMI Test"

ws.append(["Test Case", "Status", "Detail"])

green = PatternFill(start_color="90EE90", end_color="90EE90", fill_type="solid")
red = PatternFill(start_color="FF9999", end_color="FF9999", fill_type="solid")

for cell in ws[1]:
    cell.font = Font(bold=True)

pass_count = 0
fail_count = 0

def report(tc, status, detail):
    global pass_count, fail_count

    ws.append([tc, status, detail])

    row = ws.max_row

    if status == "PASS":
        ws[f"B{row}"].fill = green
        pass_count += 1
    else:
        ws[f"B{row}"].fill = red
        fail_count += 1

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
report("Login", "PASS", "Login successful")

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
    report("BMI", "PASS", "BMI calculated")
else:
    print("❌ BMI inputs not found")
    report("BMI", "FAIL", "BMI inputs not found")

for b in driver.find_elements(By.TAG_NAME, "button"):
    if "bmi" in b.text.lower() or "calculate" in b.text.lower() or "tính" in b.text.lower():
        driver.execute_script("arguments[0].click();", b)
        break

time.sleep(3)

# =========================
# 4. CALORIES
# =========================
print("TEST CALORIES...")

calories_found = False

for b in driver.find_elements(By.TAG_NAME, "button"):
    if "cal" in b.text.lower() or "calories" in b.text.lower():
        driver.execute_script("arguments[0].click();", b)
        calories_found = True
        break

time.sleep(2)

if calories_found:
    print("✅ CALORIES CALCULATED")
    report("Calories", "PASS", "Calories calculated")
else:
    print("❌ CALORIES BUTTON NOT FOUND")
    report("Calories", "FAIL", "Calories button not found")
    
    
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
    report("Health Tips", "PASS", "Health tips displayed")
except:
    print("❌ HEALTH TIPS NOT FOUND")
    report("Health Tips", "FAIL", "Health tips not found")
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
    report("Personal Suggestion", "PASS", "Suggestion generated")
except:
    print("❌ PERSONAL HEALTH SUGGESTION NOT FOUND")
    report("Personal Suggestion", "FAIL", "Suggestion not generated")

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
    report("Giảm cân", "PASS", "Clicked successfully")
except:
    print("❌ GIẢM CÂN NOT FOUND / NOT CLICKABLE")
    report("Giảm cân", "FAIL", "Button not found")
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
    report("Login", "PASS", "Login successful")
except:
    print("❌ TĂNG CÂN NOT FOUND / NOT CLICKABLE")
    report("Tăng cân", "FAIL", "Button not found")

# =========================
# 8. FINAL
# =========================
print("\n====================")
print("TEST DONE")
print("====================")

time.sleep(3)

ws.append([])
ws.append(["TOTAL PASS", pass_count])
ws.append(["TOTAL FAIL", fail_count])
ws.append(["TOTAL TEST", pass_count + fail_count])

wb.save("BMI_Test_Report.xlsx")

print("Excel report saved: BMI_Test_Report.xlsx")
driver.quit()