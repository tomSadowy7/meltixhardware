from bluezero import peripheral
import os

# Callback to handle receiving credentials
def credentials_received(value):
    try:
        decoded = value.decode("utf-8")
        ssid, password = decoded.split("||")
        print(f"[*] Received SSID: {ssid}, Password: {password}")
        save_wifi_credentials(ssid.strip(), password.strip())
    except Exception as e:
        print("[!] Failed to parse credentials:", e)

# Save credentials to wpa_supplicant.conf
def save_wifi_credentials(ssid, password):
    config = f"""
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=US

network={{
    ssid="{ssid}"
    psk="{password}"
}}
"""
    with open("/etc/wpa_supplicant/wpa_supplicant.conf", "w") as f:
        f.write(config)
    print("[*] Wi-Fi credentials saved.")
    os.system("wpa_cli -i wlan0 reconfigure")

# Define BLE characteristic
wifi_char = peripheral.Characteristic(
    uuid='12345678-1234-5678-1234-56789abcdef0',
    properties=['write'],
    value=[],
    write_callback=credentials_received
)

# Create BLE Peripheral
ble_periph = peripheral.Peripheral(
    adapter_addr=None,
    local_name='raspberrypi',
    services=[peripheral.Service(uuid='12345678-1234-5678-1234-56789abcdef1', characteristics=[wifi_char])]
)

if __name__ == "__main__":
    print("[*] Starting BLE advertising as 'raspberrypi'...")
    ble_periph.add_advertisement()
    ble_periph.start()
