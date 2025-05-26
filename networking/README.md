# meltixhardware

On Client Side (Raspberrypi 4):
1.) Open terminal
2.) Write 'ssh admin@raspberrypi.local' and press Enter
3.) Type in Password and press Enter
4.) Write 'python client.py' and press Enter

On Server Side (Esp32):
1.) Simply power on ESP32 (Arduino program already uploaded on it)

Optional: To test server connection, simply write in {esp32 ip address}/flash into favorite browser

If you don't know ESP32 local ip address (it changes), reupload server.ccp code into
ESP32 on Arduino IDE and check serial monitor for printed ip address connection