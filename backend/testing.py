from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
import time

# ✅ Update these
CHROMEDRIVER_PATH =   r"C:\Users\hp\Downloads\chromedriver-win64\chromedriver-win64\chromedriver.exe"


LOGIN_URL = "http://localhost"

# ✅ Test accounts from your DB
TEST_CASES = [
    {
        "name": "Valid Admin Login",
        "email": "admin@example.com",
        "password": "admin123",
        "expected_redirect": "/admin-dashboard"
    },
    {
        "name": "Valid PM Login",
        "email": "pm@example.com",
        "password": "pm123",
        "expected_redirect": "/pm-dashboard"
    },
    {
        "name": "Valid DM Login",
        "email": "dm@example.com",
        "password": "dm123",
        "expected_redirect": "/dm-dashboard"
    },
    {
        "name": "Invalid Login",
        "email": "fake@example.com",
        "password": "wrongpass",
        "expect_error": True
    },
    {
        "name": "Empty Fields",
        "email": "",
        "password": "",
        "expect_error": True
    }
]

def run_test(driver, test):
    print(f"\n🧪 Running test: {test['name']}")
    driver.get(LOGIN_URL)
    time.sleep(2)

    email_input = driver.find_element(By.NAME, "email")
    password_input = driver.find_element(By.NAME, "password")

    email_input.clear()
    password_input.clear()

    email_input.send_keys(test['email'])
    password_input.send_keys(test['password'])
    password_input.send_keys(Keys.RETURN)

    time.sleep(3)  # Allow page to respond

    if test.get("expect_error"):
        try:
            error = driver.find_element(By.CLASS_NAME, "error")
            print("✅ Error message shown:", error.text)
        except:
            print("❌ Expected an error, but none appeared.")
    else:
        current_url = driver.current_url
        if test['expected_redirect'] in current_url:
            print(f"✅ Login successful, redirected to: {current_url}")
        else:
            print(f"❌ Expected {test['expected_redirect']}, but got {current_url}")

# Setup driver
service = Service(CHROMEDRIVER_PATH)
driver = webdriver.Chrome(service=service)
driver.maximize_window()

# Run all test cases
for case in TEST_CASES:
    run_test(driver, case)
    time.sleep(1)

# Cleanup
driver.quit()
print("\n🎉 All tests completed.")
