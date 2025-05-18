#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "Geo";
const char* password = "Guallpa1";

const int ledPin = 33; // Use GPIO 33
WebServer server(80);

void handleFlash() {
  digitalWrite(ledPin, HIGH);
  delay(500);
  digitalWrite(ledPin, LOW);
  server.send(200, "text/plain", "GPIO 33 flashed");
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

  server.on("/flash", handleFlash);
  server.begin();
}

void loop() {
  server.handleClient();
}
