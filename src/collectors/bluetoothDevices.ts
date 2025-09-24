import { BluetoothDevice } from '../types';
import { exec } from 'child_process';
import { promisify } from 'util';
import { errorLogger } from '../utils/errorLogger';

const execAsync = promisify(exec);

export async function collectBluetoothDevices(): Promise<BluetoothDevice[]> {
  const devices: BluetoothDevice[] = [];
  
  try {
    if (process.platform === 'win32') {
      await collectWindowsBluetoothDevices(devices);
    } else if (process.platform === 'darwin') {
      await collectMacOSBluetoothDevices(devices);
    }
  } catch (error) {
    errorLogger.logError('bluetoothDevices', error);
    console.warn('⚠️ Warning: Could not collect Bluetooth device information:', error);
  }

  return devices;
}

async function collectWindowsBluetoothDevices(devices: BluetoothDevice[]): Promise<void> {
  try {
    // Get paired Bluetooth devices using PowerShell
    const { stdout } = await execAsync(
      'powershell -Command "Get-PnpDevice | Where-Object {$_.Class -eq \'Bluetooth\'} | Select-Object FriendlyName, InstanceId, Status | ConvertTo-Json"'
    );
    
    const bluetoothDevices = JSON.parse(stdout);
    
    if (Array.isArray(bluetoothDevices)) {
      for (const device of bluetoothDevices) {
        devices.push({
          id: device.InstanceId || '',
          name: device.FriendlyName || 'Unknown Bluetooth Device',
          address: extractBluetoothAddress(device.InstanceId) || '',
          connected: device.Status === 'OK',
          paired: true,
          discoverable: false,
          deviceType: 'Bluetooth Device',
          lastSeen: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    errorLogger.logError('bluetoothDevices-windows', error);
    console.warn('⚠️ Warning: Could not collect Windows Bluetooth devices:', error);
  }
}

async function collectMacOSBluetoothDevices(devices: BluetoothDevice[]): Promise<void> {
  try {
    // Get paired Bluetooth devices using system_profiler
    const { stdout } = await execAsync('system_profiler SPBluetoothDataType -json');
    const bluetoothData = JSON.parse(stdout);
    
    if (bluetoothData.SPBluetoothDataType && bluetoothData.SPBluetoothDataType.length > 0) {
      const bluetoothInfo = bluetoothData.SPBluetoothDataType[0];
      // 解析 device_connected 與 device_not_connected
      const parseDeviceList = (deviceList: any[], connected: boolean) => {
        for (const deviceObj of deviceList) {
          for (const [devName, devInfoRaw] of Object.entries(deviceObj)) {
            const devInfo = devInfoRaw as Record<string, any>;
            devices.push({
              id: devInfo.device_address || devName || '',
              name: devName || devInfo.device_name || 'Unknown Bluetooth Device',
              address: devInfo.device_address || '',
              connected,
              paired: true, // macOS system_profiler 只列出配對過的
              discoverable: false,
              deviceType: devInfo.device_minorType || 'Bluetooth Device',
              lastSeen: new Date().toISOString()
            });
          }
        }
      };
      if (Array.isArray(bluetoothInfo.device_connected)) {
        parseDeviceList(bluetoothInfo.device_connected, true);
      }
      if (Array.isArray(bluetoothInfo.device_not_connected)) {
        parseDeviceList(bluetoothInfo.device_not_connected, false);
      }
    }
  } catch (error) {
    errorLogger.logError('bluetoothDevices-macos', error);
    console.warn('⚠️ Warning: Could not collect macOS Bluetooth devices:', error);
  }
}

function extractBluetoothAddress(instanceId: string): string {
  // Extract Bluetooth address from Windows device instance ID
  const match = instanceId.match(/BTHENUM\\{0000111E-0000-1000-8000-00805F9B34FB}_VID&([A-F0-9]+)_PID&([A-F0-9]+)_([A-F0-9]+)/);
  if (match && match[3]) {
    return match[3];
  }
  return '';
} 