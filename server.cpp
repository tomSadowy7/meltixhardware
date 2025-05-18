#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

const char* ssid = "Geo";
const char* password = "Guallpa1";

const int ledPin = 33; // Use GPIO 33
WebServer server(80);

const char* correctKey = "123456";  // Replace with your actual key

void handleFlash() {
  if (server.hasArg("plain") == false) {
    server.send(400, "text/plain", "Missing body");
    return;
  }

  String body = server.arg("plain");
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, body);

  if (error) {
    server.send(400, "text/plain", "Invalid JSON");
    return;
  }
  
  const char* key = doc["key"];

  Serial.println("received");
  Serial.println(key);

  if (key && String(key) == correctKey) {
    digitalWrite(ledPin, HIGH);
    delay(500);
    digitalWrite(ledPin, LOW);
    server.send(200, "text/plain", "Flashed");
  } else {
    server.send(403, "text/plain", "Unauthorized");
  }
}


void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);
  Serial.println("before trying to connect");

  WiFi.begin(ssid, password);

  Serial.println("after trying to connect");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
  Serial.println(WiFi.localIP());

  server.on("/flash", HTTP_POST, handleFlash);
  server.begin();
}

void loop() {
  server.handleClient();
}
