import asyncio
import websockets
import json
import requests

BACKEND_WS = "ws://192.168.68.60"
ESP32_BASE_URL = "http://esp32-1.local"
AUTH_KEY = "123456"

async def forward_to_esp32(path):
    try:
        url = f"{ESP32_BASE_URL}{path}"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f"Bearer {AUTH_KEY}"
        }
        payload = json.dumps({"key": AUTH_KEY})
        r = requests.post(url, headers=headers, data=payload, timeout=3)
        print(f"[ESP32] {path} → {r.status_code}")
    except Exception as e:
        print(f"[ESP32 Error] {e}")

async def handle_messages(ws):
    async for message in ws:
        try:
            print(f"[Server] {message}")
            data = json.loads(message)
            if data.get("key") != AUTH_KEY:
                print("[Warning] Invalid key")
                continue

            command = data.get("command")
            number = data.get("number")
            if command in ["turnOn", "turnOff"] and number in [1, 2, 3, 4]:
                path = f"/led{number}/{'on' if command == 'turnOn' else 'off'}"
                await forward_to_esp32(path)
            else:
                print("[Warning] Invalid command format")
        except json.JSONDecodeError:
            print("[Error] Invalid JSON")

async def connect():
    while True:
        try:
            async with websockets.connect(BACKEND_WS) as ws:
                print("[WebSocket] Connected")
                await ws.send(json.dumps({"key": AUTH_KEY}))
                await handle_messages(ws)
        except Exception as e:
            print(f"[Connection Error] {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(connect())
