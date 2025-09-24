import { UsbDevice } from '../types';
import os from 'os';
import { errorLogger } from '../utils/errorLogger';

// Optional import for usb-detection
let usbDetection: any = null;
try {
  usbDetection = require('usb-detection');
} catch (error: any) {
  console.warn('usb-detection not available:', error.message);
  // Log the missing module error to error logs
  errorLogger.logError('usbDevices', new Error(`usb-detection module not found: ${error.message}`));
}

export async function collectUsbDevices(): Promise<UsbDevice[]> {
  let devices: UsbDevice[] = [];
  
  // Check if usb-detection is available
  if (!usbDetection) {
    console.warn('USB detection not available - usb-detection module not found');
    return devices;
  }
  
  try {
    if (process.platform === 'win32' || process.platform === 'darwin') {
      await usbDetection.startMonitoring();
      const rawDevices = await usbDetection.find();
      devices = rawDevices.map((dev: any) => ({
        vendorId: dev.vendorId?.toString() || '',
        productId: dev.productId?.toString() || '',
        deviceName: dev.deviceName || dev.deviceDescriptor?.iProduct || '',
        manufacturer: dev.manufacturer || '',
        serialNumber: dev.serialNumber || '',
        locationId: dev.locationId?.toString() || '',
        deviceAddress: dev.deviceAddress,
        connected: true
      }));
      await usbDetection.stopMonitoring();
    }
  } catch (e) {
    errorLogger.logError('usbDevices', e);
    // If usb-detection fails, return an empty array
  }

  return devices;
} 