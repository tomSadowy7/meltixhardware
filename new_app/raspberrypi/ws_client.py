import asyncio
import websockets
import json
import time

WEBSOCKET_URL = "ws://192.168.68.66:8081"  # CHANGE THIS to your backend's websocket URL/port

HOMEBASE_ID_FILE = "/etc/homebase-id"

def read_homebase_id():
    try:
        with open(HOMEBASE_ID_FILE, 'r') as f:
            return f.read().strip()
    except Exception as e:
        print(f"[ws_client] Could not read HomeBase ID: {e}")
        return "UNKNOWN-HOMEBASE-ID"

async def connect_and_run():
    homebase_id = read_homebase_id()
    while True:
        try:
            print(f"[ws_client] Connecting to backend at {WEBSOCKET_URL} ...")
            async with websockets.connect(WEBSOCKET_URL) as ws:
                # Identify yourself to the backend
                hello_msg = json.dumps({
                    "type": "register",
                    "homeBaseId": homebase_id
                })
                await ws.send(hello_msg)
                print(f"[ws_client] Sent registration: {hello_msg}")

                while True:
                    msg = await ws.recv()
                    print(f"[ws_client] Received from server: {msg}")
                    # Optionally, parse and act on commands here
        except Exception as e:
            print(f"[ws_client] Connection lost or failed: {e}")
            print("[ws_client] Reconnecting in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    asyncio.run(connect_and_run())
