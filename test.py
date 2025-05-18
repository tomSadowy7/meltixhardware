import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
GPIO.setup(23, GPIO.OUT)

# Flicker 5 times
for _ in range(5):
    GPIO.output(23, GPIO.HIGH)
    time.sleep(0.5)  # On for 0.5 seconds
    GPIO.output(23, GPIO.LOW)
    time.sleep(0.5)  # Off for 0.5 seconds

GPIO.cleanup()
