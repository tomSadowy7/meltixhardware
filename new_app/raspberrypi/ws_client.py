import asyncio
import websockets
import json
import time
import subprocess

WEBSOCKET_URL = "ws://192.168.1.127:8081"  # CHANGE THIS to your backend's websocket URL/port

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
                    "homebaseId": homebase_id
                })
                await ws.send(hello_msg)
                print(f"[ws_client] Sent registration: {hello_msg}")

                while True:
                    msg = await ws.recv()
                    print(f"[ws_client] Received from server: {msg}")
                    # Optionally, parse and act on commands here
                    try:
                        data = json.loads(msg)
                        if data.get("type") == "start_provisioning":
                            print("[ws_client] Starting BLE provisioning mode...")
                            # You could start your BLE provisioning subprocess here!
                            subprocess.Popen(['python3', '/home/admin/ble_provision.py'])
                    except Exception as ex:
                        print("[ws_client] Error processing message:", ex)
        except Exception as e:
            print(f"[ws_client] Connection lost or failed: {e}")
            print("[ws_client] Reconnecting in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    asyncio.run(connect_and_run())
