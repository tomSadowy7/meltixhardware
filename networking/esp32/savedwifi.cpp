// (all includes remain the same)
#include <WiFi.h>
#include <Preferences.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <ESPmDNS.h>

#define RESET_PIN 0

Preferences prefs;
BLECharacteristic *ssidChar;
BLECharacteristic *passChar;
BLECharacteristic *statusChar;

String receivedSSID = "", receivedPass = "";
bool ssidReady = false, passReady = false;

const int ledPins[4] = {33, 34, 35, 36};

WebServer server(80);
const char* correctKey = "123456";

void notifyStatus(bool success) {
  if (statusChar) {
    statusChar->setValue(success ? "CONNECTED" : "FAILED");
    statusChar->notify();
  }
}

class WifiCallback : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *charac) {
    String val = charac->getValue().c_str();
    if (charac == ssidChar) {
      receivedSSID = val;
      ssidReady = true;
      Serial.println("SSID received: " + receivedSSID);
    } else if (charac == passChar) {
      receivedPass = val;
      passReady = true;
      Serial.println("Password received");
    }

    if (ssidReady && passReady) {
      prefs.begin("wifi", false);
      prefs.putString("ssid", receivedSSID);
      prefs.putString("pass", receivedPass);
      prefs.end();

      WiFi.begin(receivedSSID.c_str(), receivedPass.c_str());
      Serial.println("Connecting to Wi-Fi...");
      for (int i = 0; i < 10; ++i) {
        if (WiFi.status() == WL_CONNECTED) break;
        delay(1000);
        Serial.print(".");
      }

      bool connected = WiFi.status() == WL_CONNECTED;
      Serial.println(connected ? "\nConnected!" : "\nConnection failed.");
      notifyStatus(connected);

      if (!connected) {
        ssidReady = false;
        passReady = false;
        receivedSSID = "";
        receivedPass = "";
      } else {
        startServer();
      }
    }
  }
};

void startBLE() {
  BLEDevice::init("ESP32-WiFi-Setup");
  BLEServer *server = BLEDevice::createServer();
  BLEService *service = server->createService("0000ffff-0000-1000-8000-00805f9b34fb");

  ssidChar = service->createCharacteristic("0000aaaa-0000-1000-8000-00805f9b34fb", BLECharacteristic::PROPERTY_WRITE);
  passChar = service->createCharacteristic("0000bbbb-0000-1000-8000-00805f9b34fb", BLECharacteristic::PROPERTY_WRITE);
  statusChar = service->createCharacteristic("0000cccc-0000-1000-8000-00805f9b34fb", BLECharacteristic::PROPERTY_NOTIFY);

  ssidChar->setCallbacks(new WifiCallback());
  passChar->setCallbacks(new WifiCallback());

  service->start();
  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID("0000ffff-0000-1000-8000-00805f9b34fb");
  advertising->start();

  Serial.println("BLE server started. Waiting for credentials...");
}

void handleLEDControl(int pin, bool turnOn) {
  if (!server.hasArg("plain")) {
    server.send(400, "text/plain", "Missing body");
    return;
  }

  String body = server.arg("plain");
  StaticJsonDocument<200> doc;
  if (deserializeJson(doc, body)) {
    server.send(400, "text/plain", "Invalid JSON");
    return;
  }

  const char* key = doc["key"];
  if (key && String(key) == correctKey) {
    digitalWrite(pin, turnOn ? HIGH : LOW);
    server.send(200, "text/plain", turnOn ? "LED turned on" : "LED turned off");
  } else {
    server.send(403, "text/plain", "Unauthorized");
  }
}

void startServer() {
  for (int i = 0; i < 4; ++i) {
    pinMode(ledPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW);
  }

  if (!MDNS.begin("esp32-1")) {
    Serial.println("Error setting up mDNS responder!");
  } else {
    Serial.println("mDNS responder started: esp32-1.local");
  }

  // Add routes for each LED
  server.on("/led1/on", HTTP_POST, []() { handleLEDControl(ledPins[0], true); });
  server.on("/led1/off", HTTP_POST, []() { handleLEDControl(ledPins[0], false); });

  server.on("/led2/on", HTTP_POST, []() { handleLEDControl(ledPins[1], true); });
  server.on("/led2/off", HTTP_POST, []() { handleLEDControl(ledPins[1], false); });

  server.on("/led3/on", HTTP_POST, []() { handleLEDControl(ledPins[2], true); });
  server.on("/led3/off", HTTP_POST, []() { handleLEDControl(ledPins[2], false); });

  server.on("/led4/on", HTTP_POST, []() { handleLEDControl(ledPins[3], true); });
  server.on("/led4/off", HTTP_POST, []() { handleLEDControl(ledPins[3], false); });

  server.begin();
  Serial.println("HTTP server started");
}

void setup() {
  Serial.begin(115200);
  pinMode(RESET_PIN, INPUT_PULLUP);

  if (digitalRead(RESET_PIN) == LOW) {
    Serial.println("Clearing saved Wi-Fi...");
    prefs.begin("wifi", false);
    prefs.clear();
    prefs.end();
    delay(1000);
    ESP.restart();
  }

  prefs.begin("wifi", true);
  String ssid = prefs.getString("ssid", "");
  String pass = prefs.getString("pass", "");
  prefs.end();

  if (ssid != "" && pass != "") {
    WiFi.begin(ssid.c_str(), pass.c_str());
    Serial.println("Connecting to saved Wi-Fi...");
    for (int i = 0; i < 10; ++i) {
      if (WiFi.status() == WL_CONNECTED) break;
      delay(1000);
      Serial.print(".");
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nWi-Fi connected.");
      startServer();
      return;
    }

    Serial.println("\nConnection failed. Starting BLE...");
  }

  startBLE();
}

void loop() {
  if (digitalRead(RESET_PIN) == LOW) {
    prefs.begin("wifi", false);
    prefs.clear();
    prefs.end();
    delay(1000);
    ESP.restart();
  }

  server.handleClient();
  delay(10);
}
