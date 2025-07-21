#!/bin/bash
# Log everything to file
exec >> /home/admin/onboot.log 2>&1
echo "[boot] Launching at $(date)"

# Bluetooth setup
bluetoothctl <<EOF
pairable off
exit
EOF

sleep 2 
bluetoothctl show

if [ -f /etc/homebase-token ]; then
    echo "[boot] Found token, launching WebSocket client..."
    sudo python3 /home/admin/ws_client.py
else
    echo "[boot] No token, starting BLE provisioning..."
    sudo python3 /home/admin/pyserver.py
fi