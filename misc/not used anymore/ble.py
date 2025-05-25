#!/usr/bin/env python3
from pydbus import SystemBus
from gi.repository import GLib
import dbus
import os

bus = SystemBus()
adapter_path = "/org/bluez/hci0"
mainloop = GLib.MainLoop()

ssid_value = ""
password_value = ""

class WifiCharacteristic:
    def __init__(self, uuid, on_write):
        self.uuid = uuid
        self.on_write = on_write
        self.value = []

    def ReadValue(self, options):
        return self.value

    def WriteValue(self, value, options):
        self.value = value
        decoded = bytearray(value).decode("utf-8")
        self.on_write(decoded)

class BLEService:
    def __init__(self):
        self.ssid_char = WifiCharacteristic("12345678-1234-5678-1234-56789abcdef0", self.set_ssid)
        self.pass_char = WifiCharacteristic("abcdef01-1234-5678-1234-56789abcdef0", self.set_password)

    def get_gatt_service(self):
        return {
            "/org/bluez/example/service0": {
                "org.bluez.GattService1": {
                    "UUID": "180D",
                    "Primary": True
                },
                "/org/bluez/example/service0/char0": {
                    "org.bluez.GattCharacteristic1": {
                        "UUID": self.ssid_char.uuid,
                        "Service": "/org/bluez/example/service0",
                        "Flags": ["write"],
                    }
                },
                "/org/bluez/example/service0/char1": {
                    "org.bluez.GattCharacteristic1": {
                        "UUID": self.pass_char.uuid,
                        "Service": "/org/bluez/example/service0",
                        "Flags": ["write"],
                    }
                }
            }
        }

    def set_ssid(self, ssid):
        global ssid_value
        ssid_value = ssid
        print("Received SSID:", ssid)

    def set_password(self, password):
        global password_value
        password_value = password
        print("Received Password:", password)
        self.connect_to_wifi()

    def connect_to_wifi(self):
        print(f"Attempting to connect to Wi-Fi SSID: {ssid_value}")
        os.system(f"nmcli device wifi connect '{ssid_value}' password '{password_value}'")

def register_gatt_server():
    service = BLEService()
    adapter = bus.get("org.bluez", adapter_path)
    adapter.Set("org.bluez.Adapter1", "Powered", dbus.Boolean(1))

    app = service.get_gatt_service()
    print("GATT server running... (Press Ctrl+C to stop)")
    mainloop.run()

if __name__ == "__main__":
    register_gatt_server()
