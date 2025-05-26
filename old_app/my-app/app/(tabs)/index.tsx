import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const SERVICE_UUID = '180D'; // Same as your ESP32 service
const SSID_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef0';
const PASS_CHAR_UUID = 'abcdef01-1234-5678-1234-56789abcdef0';

const manager = new BleManager();

export default function HomeScreen() {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('Not connected');
  const [device, setDevice] = useState<any>(null);

  const scanAndConnect = async () => {
    setStatus('Scanning...');

    manager.startDeviceScan([SERVICE_UUID], null, async (error, scannedDevice) => {
      if (error) {
        setStatus('Scan error: ' + error.message);
        return;
      }

      if (scannedDevice?.name?.includes('ESP32')) {
        setStatus('Connecting to ' + scannedDevice.name);
        manager.stopDeviceScan();

        try {
          const connectedDevice = await scannedDevice.connect();
          await connectedDevice.discoverAllServicesAndCharacteristics();
          setDevice(connectedDevice);
          setStatus('Connected');
        } catch (e) {
          setStatus('Connection failed: ' + e.message);
        }
      }
    });
  };

  const sendCredentials = async () => {
    if (!device) {
      setStatus('Not connected to a device');
      return;
    }

    try {
      await device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        SSID_CHAR_UUID,
        Buffer.from(ssid).toString('base64')
      );

      await device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        PASS_CHAR_UUID,
        Buffer.from(password).toString('base64')
      );

      setStatus('Credentials sent');
    } catch (e) {
      setStatus('Failed to send: ' + e.message);
    }
  };

  useEffect(() => {
    return () => {
      manager.destroy();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wi-Fi Provisioning</Text>
      <TextInput
        placeholder="SSID"
        value={ssid}
        onChangeText={setSsid}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Button title="Scan & Connect" onPress={scanAndConnect} />
      <Button title="Send Credentials" onPress={sendCredentials} />
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 12, padding: 10, borderRadius: 6 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  status: { marginTop: 20, textAlign: 'center' },
});
