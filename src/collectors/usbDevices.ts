import { UsbDevice } from '../types';
import os from 'os';
import { errorLogger } from '../utils/errorLogger';

// Optional import for node-usb
let usb: any = null;
try {
  usb = require('usb');
} catch (error: any) {
  console.warn('node-usb not available:', error.message);
  // Log the missing module error to error logs
  errorLogger.logError('usbDevices', new Error(`node-usb module not found: ${error.message}`));
}

export async function collectUsbDevices(): Promise<UsbDevice[]> {
  let devices: UsbDevice[] = [];
  
  // Check if node-usb is available
  if (!usb) {
    console.warn('USB detection not available - node-usb module not found');
    return devices;
  }
  
  try {
    // Use node-usb to get device list
    const rawDevices = usb.getDeviceList();
    
    devices = rawDevices.map((dev: any) => {
      const descriptor = dev.deviceDescriptor;
      
      // Skip trying to get string descriptors to avoid callback issues
      // Just use the basic descriptor information
      return {
        vendorId: descriptor.idVendor?.toString(16).padStart(4, '0') || '',
        productId: descriptor.idProduct?.toString(16).padStart(4, '0') || '',
        deviceName: '', // Skip string descriptors to avoid callback issues
        manufacturer: '', // Skip string descriptors to avoid callback issues
        serialNumber: '', // Skip string descriptors to avoid callback issues
        locationId: dev.busNumber?.toString() + '-' + dev.deviceAddress?.toString() || '',
        deviceAddress: dev.deviceAddress,
        connected: true
      };
    });
  } catch (e) {
    errorLogger.logError('usbDevices', e);
    // If node-usb fails, return an empty array
  }

  return devices;
} 