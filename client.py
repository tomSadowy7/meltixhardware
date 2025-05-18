import requests
import time

url = "http://192.168.68.52/flash"

while True:
    try:
        response = requests.get(url)
        print(f"Response: {response.text}")
    except requests.RequestException as e:
        print(f"Request failed: {e}")
    time.sleep(5)
