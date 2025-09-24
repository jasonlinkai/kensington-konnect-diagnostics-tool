export interface SystemInfo {
  os: string;
  osVersion: string;
  cpuArchitecture: string;
  platform: string;
  totalMemory: number;
  freeMemory: number;
  cpuCount: number;
  uptime: number;
  timestamp: string;
}

export interface UsbDevice {
  vendorId: string;
  productId: string;
  deviceName: string;
  manufacturer: string;
  serialNumber?: string;
  locationId?: string;
  deviceAddress?: number;
  connected: boolean;
}

export interface BluetoothDevice {
  id: string;
  name: string;
  address: string;
  rssi?: number;
  manufacturer?: string;
  deviceClass?: string;
  deviceType?: string;
  connected: boolean;
  paired: boolean;
  discoverable: boolean;
  lastSeen?: string;
}

export interface CrashReport {
  appName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  lastModified: string;
  content?: string;
}

export interface LogFile {
  appName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  lastModified: string;
}

export interface CollectionResult {
  systemInfo: SystemInfo;
  usbDevices: UsbDevice[];
  bluetoothDevices: BluetoothDevice[];
  crashReports: CrashReport[];
  logFiles: LogFile[];
} 