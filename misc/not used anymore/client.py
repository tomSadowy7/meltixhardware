import time
import requests

url = "http://esp32-1.local/flash"
data = {"key": "123456"}

while True:
    try:
        response = requests.post(url, json=data)
        print(f"Response: {response.text}")
    except requests.RequestException as e:
        print(f"Request failed: {e}")
    time.sleep(0.5)


