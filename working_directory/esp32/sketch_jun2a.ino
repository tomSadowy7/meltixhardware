/*
NOTES
adjust for user inputted wifi/password
adjust for timezone
*/

#include <WiFi.h>
#include "time.h"
#include <TFT_eSPI.h>

TFT_eSPI tft;

const char* ssid = "Geo";
const char* password = "Guallpa1";

// Timezone settings (adjust these for your location)
const long gmtOffset_sec = -5 * 3600;  // Example for EST (UTC-5)
const int daylightOffset_sec = 3600;       // Set to 3600 if DST is in effect

void setup() {
  Serial.begin(115200);
  tft.init();
  tft.setRotation(1);
  tft.fillScreen(TFT_BLACK);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  // Configure NTP
  configTime(gmtOffset_sec, daylightOffset_sec, "pool.ntp.org");
  
  // Wait for time sync
  struct tm timeinfo;
  while (!getLocalTime(&timeinfo)) {
    delay(1000);
    Serial.println("Waiting for time synchronization...");
  }
}

void loop() {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    char timeStr[20];
    // 12-hour format with AM/PM
    strftime(timeStr, sizeof(timeStr), "%r", &timeinfo); // %r = full 12-hour time with AM/PM
    
    // Alternative format if you want more control:
    // strftime(timeStr, sizeof(timeStr), "%I:%M:%S %p", &timeinfo);
    
    tft.fillRect(0, 0, 240, 30, TFT_BLACK);
    tft.setTextColor(TFT_WHITE, TFT_BLACK);
    tft.setTextSize(2); // Make text larger if needed
    tft.drawString(timeStr, 10, 10);
    
    // Debug output to serial monitor
    Serial.print("24-hour time: ");
    Serial.println(&timeinfo, "%H:%M:%S");
    Serial.print("12-hour time: ");
    Serial.println(timeStr);
  }
  delay(1000);
}