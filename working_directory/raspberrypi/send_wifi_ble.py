import asyncio
from bleak import BleakClient, BleakScanner

SERVICE_UUID = "0000ffff-0000-1000-8000-00805f9b34fb"
SSID_CHAR_UUID = "0000aaaa-0000-1000-8000-00805f9b34fb"
PASS_CHAR_UUID = "0000bbbb-0000-1000-8000-00805f9b34fb"
STATUS_CHAR_UUID = "0000cccc-0000-1000-8000-00805f9b34fb"

WIFI_SSID = "YourWiFiName"
WIFI_PASSWORD = "YourWiFiPassword"

status_received = asyncio.Event()
wifi_status = None

def handle_status(_, data):
    global wifi_status
    wifi_status = data.decode()
    print(f"Status from ESP32: {wifi_status}")
    status_received.set()

async def main():
    print("Scanning for ESP32...")
    devices = await BleakScanner.discover()
    esp_device = None
    for d in devices:
        if d.name and "ESP32" in d.name:
            esp_device = d
            break

    if not esp_device:
        print("ESP32 not found.")
        return

    async with BleakClient(esp_device.address) as client:
        print("Connected to ESP32")

        # Subscribe to status notifications
        await client.start_notify(STATUS_CHAR_UUID, handle_status)

        # Write SSID and password
        print("Sending Wi-Fi credentials...")
        await client.write_gatt_char(SSID_CHAR_UUID, WIFI_SSID.encode(), response=True)
        await asyncio.sleep(0.5)
        await client.write_gatt_char(PASS_CHAR_UUID, WIFI_PASSWORD.encode(), response=True)

        print("Waiting for connection result...")
        await status_received.wait()

        print(f"Wi-Fi connection result: {wifi_status}")

asyncio.run(main())
