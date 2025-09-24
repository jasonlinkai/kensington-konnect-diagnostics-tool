import { errorLogger } from '../utils/errorLogger';

// Optional import for node-hid
let nodeHid: any = null;
try {
  nodeHid = require('node-hid');
} catch (error: any) {
  console.warn('node-hid not available:', error.message);
  // Log the missing module error to error logs
  errorLogger.logError('inputDevices', new Error(`node-hid module not found: ${error.message}`));
}

export interface InputDeviceInfo {
  type: 'keyboard' | 'mouse' | 'other';
  manufacturer?: string;
  product?: string;
  vendorId?: number;
  productId?: number;
  serialNumber?: string;
  path?: string;
  usagePage?: number;
  usage?: number;
}

function getDeviceType(device: any): 'keyboard' | 'mouse' | 'other' {
  // usagePage: 0x01, usage: 0x06 => keyboard
  // usagePage: 0x01, usage: 0x02 => mouse
  if (device.usagePage === 0x01 && device.usage === 0x06) return 'keyboard';
  if (device.usagePage === 0x01 && device.usage === 0x02) return 'mouse';
  return 'other';
}

export async function collectInputDevices(): Promise<InputDeviceInfo[]> {
  // Check if node-hid is available
  if (!nodeHid) {
    console.warn('Input device detection not available - node-hid module not found');
    return [];
  }
  
  try {
    const devices: any[] = nodeHid.devices();
    const inputDevices = devices
      .map((d) => ({
        type: getDeviceType(d),
        manufacturer: d.manufacturer,
        product: d.product,
        vendorId: d.vendorId,
        productId: d.productId,
        serialNumber: d.serialNumber,
        path: d.path,
        usagePage: d.usagePage,
        usage: d.usage,
      }))
      .filter((d) => d.type === 'keyboard' || d.type === 'mouse');

    return inputDevices;
  } catch (error: any) {
    errorLogger.logError('inputDevices', error);
    console.warn('⚠️ Failed to collect input devices:', error.message);
    return [];
  }
} 