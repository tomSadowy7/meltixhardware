//code for esp32
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <ESPmDNS.h>

const char* ssid = "Geo";
const char* password = "Guallpa1";

const int ledPin1 = 33; // Use GPIO 33
const int ledPin2 = 34; 
const int ledPin3 = 35; 
const int ledPin4 = 36; 
WebServer server(80);

const char* correctKey = "123456";  // Replace with your actual key

void handleFlashOne() {
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
    digitalWrite(ledPin1, HIGH);
    delay(500);
    digitalWrite(ledPin1, LOW);
    server.send(200, "text/plain", "Flashed");
  } else {
    server.send(403, "text/plain", "Unauthorized");
  }
}

void handleFlashTwo() {
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
    digitalWrite(ledPin2, HIGH);
    delay(500);
    digitalWrite(ledPin2, LOW);
    server.send(200, "text/plain", "Flashed");
  } else {
    server.send(403, "text/plain", "Unauthorized");
  }
}

void handleFlashThree() {
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
    digitalWrite(ledPin3, HIGH);
    delay(500);
    digitalWrite(ledPin3, LOW);
    server.send(200, "text/plain", "Flashed");
  } else {
    server.send(403, "text/plain", "Unauthorized");
  }
}

void handleFlashFour() {
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
    digitalWrite(ledPin4, HIGH);
    delay(500);
    digitalWrite(ledPin4, LOW);
    server.send(200, "text/plain", "Flashed");
  } else {
    server.send(403, "text/plain", "Unauthorized");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(ledPin1, OUTPUT);
  pinMode(ledPin2, OUTPUT);
  pinMode(ledPin3, OUTPUT);
  pinMode(ledPin4, OUTPUT);
  digitalWrite(ledPin1, LOW);
  digitalWrite(ledPin2, LOW);
  digitalWrite(ledPin3, LOW);
  digitalWrite(ledPin4, LOW);
  Serial.println("before trying to connect");

  WiFi.begin(ssid, password);

  Serial.println("after trying to connect");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
  Serial.println(WiFi.localIP());


    // Initialize mDNS
  if (!MDNS.begin("esp32-1")) {
    Serial.println("Error setting up mDNS responder!");
  } else {
    Serial.println("mDNS responder started: esp32-1.local");
  }


  server.on("/flashone", HTTP_POST, handleFlashOne);
  server.on("/flashtwo", HTTP_POST, handleFlashTwo);
  server.on("/flashthree", HTTP_POST, handleFlashThree);
  server.on("/flashfour", HTTP_POST, handleFlashFour);
  server.begin();
}

void loop() {
  server.handleClient();
}