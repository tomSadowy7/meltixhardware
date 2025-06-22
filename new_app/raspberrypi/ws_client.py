import asyncio
import websockets
import json
import time
import subprocess

WEBSOCKET_URL_BASE = "ws://192.168.1.127:8081"  # Just the base, no query yet

HOMEBASE_ID_FILE = "/etc/homebase-id"
USER_TOKEN_FILE = "/etc/user-token"


def read_file(path):
    try:
        with open(path, 'r') as f:
            return f.read().strip()
    except Exception as e:
        print(f"[ws_client] Could not read {path}: {e}")
        return None

async def connect_and_run():
    homebase_id = read_file(HOMEBASE_ID_FILE)
    user_token = read_file(USER_TOKEN_FILE)
    if not homebase_id or not user_token:
        print("[ws_client] Missing homebase ID or user token. Exiting.")
        return

    ws_url = f"{WEBSOCKET_URL_BASE}?token={user_token}"

    while True:
        try:
            print(f"[ws_client] Connecting to backend at {ws_url} ...")
            async with websockets.connect(ws_url) as ws:
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

                    try:
                        data = json.loads(msg)

                        # ----- 1️⃣ already-existing branch -----
                        if data.get("type") == "start_provisioning":
                            print("[ws_client] Starting BLE provisioning mode …")
                            subprocess.Popen(
                                ['python3', '/home/admin/ble_provision.py']
                            )

                        # ----- 2️⃣ NEW branch for sprinkler commands -----
                        elif data.get("type") == "sprinklerCmd":
                            # expected payload the backend sends **to this Pi**
                            # {
                            #   "type": "sprinklerCmd",
                            #   "lanName": "esp32-frontyard.local",
                            #   "zone": 3,
                            #   "on": true,
                            #   "key": "123456"          # same shared secret
                            # }
                            lan  = data["lanName"]          # mDNS / IP of ESP32
                            zone = data["zone"]             # 1-4
                            on   = data["on"]               # True/False
                            key  = data["key"]              # auth key

                            path = f"/led{zone}/" + ("on" if on else "off")
                            url  = f"http://{lan}{path}"

                            print(f"[ws_client]  → {url}")

                            # form-URL-encoded or JSON – ESP32 expects JSON body
                            import requests, json as pj
                            try:
                                resp = requests.post(
                                    url,
                                    json={"key": key},
                                    timeout=3
                                )
                                print("[ws_client] ESP32 replied:",
                                      resp.status_code, resp.text)
                            except requests.RequestException as e:
                                print("[ws_client] HTTP error talking to ESP32:", e)

                    except Exception as ex:
                        print("[ws_client] Error processing message:", ex)           
                          
        except Exception as e:
            print(f"[ws_client] aaaaa Connection lost or failed: {e}")
            print("[ws_client] Reconnecting in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    asyncio.run(connect_and_run())
