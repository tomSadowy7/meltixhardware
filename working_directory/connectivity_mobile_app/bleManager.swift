import CoreBluetooth
import Foundation

class BleManager: NSObject, ObservableObject, CBCentralManagerDelegate, CBPeripheralDelegate {
    private var centralManager: CBCentralManager!
    private var espPeripheral: CBPeripheral?

    private let serviceUUID = CBUUID(string: "0000ffff-0000-1000-8000-00805f9b34fb")
    private let ssidCharUUID = CBUUID(string: "0000aaaa-0000-1000-8000-00805f9b34fb")
    private let passCharUUID = CBUUID(string: "0000bbbb-0000-1000-8000-00805f9b34fb")
    private let statusCharUUID = CBUUID(string: "0000cccc-0000-1000-8000-00805f9b34fb")

    private var ssidChar: CBCharacteristic?
    private var passChar: CBCharacteristic?
    private var statusChar: CBCharacteristic?

    @Published var status = "Idle"

    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }

    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state == .poweredOn {
            status = "Scanning for ESP32..."
            centralManager.scanForPeripherals(withServices: [serviceUUID], options: nil)
        } else {
            status = "Bluetooth unavailable"
        }
    }

    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral,
                        advertisementData: [String: Any], rssi RSSI: NSNumber) {
        if let name = peripheral.name, name.contains("ESP32") {
            status = "Connecting to \(name)..."
            espPeripheral = peripheral
            espPeripheral?.delegate = self
            centralManager.stopScan()
            centralManager.connect(peripheral, options: nil)
        }
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        status = "Discovering services..."
        peripheral.discoverServices([serviceUUID])
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        for service in peripheral.services ?? [] {
            if service.uuid == serviceUUID {
                status = "Discovering characteristics..."
                peripheral.discoverCharacteristics([ssidCharUUID, passCharUUID, statusCharUUID], for: service)
            }
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        for characteristic in service.characteristics ?? [] {
            switch characteristic.uuid {
            case ssidCharUUID: ssidChar = characteristic
            case passCharUUID: passChar = characteristic
            case statusCharUUID:
                statusChar = characteristic
                peripheral.setNotifyValue(true, for: characteristic)
            default: break
            }
        }

        if ssidChar != nil && passChar != nil && statusChar != nil {
            status = "Ready to send credentials"
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        if characteristic.uuid == statusCharUUID,
           let data = characteristic.value,
           let msg = String(data: data, encoding: .utf8) {
            DispatchQueue.main.async {
                self.status = "ESP32: \(msg)"
            }
        }
    }

    func sendWifiCredentials(ssid: String, password: String) {
        guard let peripheral = espPeripheral,
              let ssidChar = ssidChar,
              let passChar = passChar else {
            status = "Not connected"
            return
        }

        if let ssidData = ssid.data(using: .utf8),
           let passData = password.data(using: .utf8) {
            peripheral.writeValue(ssidData, for: ssidChar, type: .withResponse)

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                peripheral.writeValue(passData, for: passChar, type: .withResponse)
            }

            status = "Sent Wi-Fi credentials"
        } else {
            status = "Invalid credentials"
        }
    }

    func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        status = "Failed to connect"
    }

    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        status = "Disconnected"
    }
}
