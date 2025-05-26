#include <WiFi.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

String receivedSSID = "";
String receivedPass = "";

BLECharacteristic *ssidCharacteristic;
BLECharacteristic *passCharacteristic;
BLECharacteristic *statusCharacteristic;

bool ssidReceived = false;
bool passReceived = false;

#define STATUS_CONNECTED "CONNECTED"
#define STATUS_FAILED    "FAILED"

class WifiCredsCallback : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pChar) {
    String value = pChar->getValue().c_str();

    if (pChar == ssidCharacteristic) {
      receivedSSID = value;
      Serial.println("Received SSID: " + receivedSSID);
      ssidReceived = true;
    } else if (pChar == passCharacteristic) {
      receivedPass = value;
      Serial.println("Received Password: " + receivedPass);
      passReceived = true;
    }

    if (ssidReceived && passReceived) {
      Serial.println("Connecting to Wi-Fi...");
      WiFi.begin(receivedSSID.c_str(), receivedPass.c_str());

      int attempts = 0;
      while (WiFi.status() != WL_CONNECTED && attempts < 10) {
        delay(1000);
        Serial.print(".");
        attempts++;
      }

      if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWi-Fi connected! IP: " + WiFi.localIP().toString());
        statusCharacteristic->setValue(STATUS_CONNECTED);
      } else {
        Serial.println("\nWi-Fi connection failed.");
        statusCharacteristic->setValue(STATUS_FAILED);
      }

      statusCharacteristic->notify();
      ssidReceived = false;
      passReceived = false;
    }
  }
};

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);

  BLEDevice::init("ESP32-WiFi-Setup");
  BLEServer *pServer = BLEDevice::createServer();
  BLEService *pService = pServer->createService("0000ffff-0000-1000-8000-00805f9b34fb");

  ssidCharacteristic = pService->createCharacteristic(
    "0000aaaa-0000-1000-8000-00805f9b34fb",
    BLECharacteristic::PROPERTY_WRITE
  );
  ssidCharacteristic->setCallbacks(new WifiCredsCallback());

  passCharacteristic = pService->createCharacteristic(
    "0000bbbb-0000-1000-8000-00805f9b34fb",
    BLECharacteristic::PROPERTY_WRITE
  );
  passCharacteristic->setCallbacks(new WifiCredsCallback());

  statusCharacteristic = pService->createCharacteristic(
    "0000cccc-0000-1000-8000-00805f9b34fb",
    BLECharacteristic::PROPERTY_NOTIFY
  );

  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID("0000ffff-0000-1000-8000-00805f9b34fb");
  pAdvertising->start();

  Serial.println("BLE server started. Waiting for Wi-Fi credentials...");
}

void loop() {
  delay(1000);
}
