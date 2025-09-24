import path from 'path';
import os from 'os';
import fs from 'fs';
import { collectSystemInfo } from './collectors/systemInfo';
import { collectLogs } from './collectors/logs';
import { collectCrashReports } from './collectors/crashReports';
import { collectUsbDevices } from './collectors/usbDevices';
import { collectInputDevices } from './collectors/inputDevices';
import { collectBluetoothDevices } from './collectors/bluetoothDevices';
import { createZipArchive } from './utils/zipUtils';
import { errorLogger } from './utils/errorLogger';

// Read version from package.json
const version = process.env.BUILD_VERSION || '1.0.0';

// Export types for external use
export interface DiagnosticsOptions {
  outputDir?: string;
  includeLogs?: boolean;
  includeCrashReports?: boolean;
  includeUsbDevices?: boolean;
  includeInputDevices?: boolean;
  includeBluetoothDevices?: boolean;
  createZip?: boolean;
  zipOutputPath?: string;
}

export interface DiagnosticsResult {
  success: boolean;
  outputPath?: string;
  tempDir?: string;
  data?: DiagnosticsData;
  error?: string;
}

export interface DiagnosticsData {
  systemInfo: any;
  usbDevices: any[];
  inputDevices: any[];
  bluetoothDevices: any[];
  version: string;
  buildDate: string;
  hasErrors: boolean;
  errorCount: number;
}

// Main API function for external use
export async function runDiagnostics(options: DiagnosticsOptions = {}): Promise<DiagnosticsResult> {
  const {
    outputDir,
    includeLogs = true,
    includeCrashReports = true,
    includeUsbDevices = true,
    includeInputDevices = true,
    includeBluetoothDevices = true,
    createZip = true,
    zipOutputPath
  } = options;

  try {
    // Create temp directory
    const tempDir = outputDir || path.join(os.tmpdir(), 'kensington-konnect-diagnostics-' + Date.now());
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    // Initialize error logger
    errorLogger.setTempDir(tempDir);

    // Collect system information
    console.log('📊 Collecting system information...');
    const systemInfo = await collectSystemInfo();
    fs.writeFileSync(path.join(tempDir, 'system-info.json'), JSON.stringify(systemInfo, null, 2));
    console.log('✅ System information collected');

    // Collect logs if requested
    if (includeLogs) {
      console.log('📝 Collecting system logs...');
      await collectLogs(tempDir);
      console.log('✅ System logs collected');
    }

    // Collect crash reports if requested
    if (includeCrashReports) {
      console.log('💥 Collecting crash reports...');
      await collectCrashReports(tempDir);
      console.log('✅ Crash reports collected');
    }

    // Collect USB devices if requested
    let usbDevices: any[] = [];
    if (includeUsbDevices) {
      console.log('🔌 Collecting USB devices...');
      usbDevices = await collectUsbDevices();
      fs.writeFileSync(path.join(tempDir, 'usb-devices.json'), JSON.stringify(usbDevices, null, 2));
      console.log(`✅ USB devices collected (${usbDevices.length} devices)`);
    }

    // Collect input devices if requested
    let inputDevices: any[] = [];
    if (includeInputDevices) {
      console.log('🖱️ Collecting input devices...');
      inputDevices = await collectInputDevices();
      fs.writeFileSync(path.join(tempDir, 'input-devices.json'), JSON.stringify(inputDevices, null, 2));
      console.log(`✅ Input devices collected (${inputDevices.length} devices)`);
    }

    // Collect Bluetooth devices if requested
    let bluetoothDevices: any[] = [];
    if (includeBluetoothDevices) {
      console.log('📱 Collecting Bluetooth devices...');
      bluetoothDevices = await collectBluetoothDevices();
      fs.writeFileSync(path.join(tempDir, 'bluetooth-devices.json'), JSON.stringify(bluetoothDevices, null, 2));
      console.log(`✅ Bluetooth devices collected (${bluetoothDevices.length} devices)`);
    }

    // Save error logs
    console.log('📋 Saving error logs...');
    await errorLogger.saveToFile();
    console.log('✅ Error logs saved');

    // Create info.json
    const infoData = {
      version: version,
      buildDate: new Date().toISOString(),
      toolName: 'Kensington Konnect Diagnostics Tool',
      hasErrors: errorLogger.hasErrors(),
      errorCount: errorLogger.getLogEntries().length
    };
    fs.writeFileSync(path.join(tempDir, 'info.json'), JSON.stringify(infoData, null, 2));

    let finalOutputPath = tempDir;

    // Create zip if requested
    if (createZip) {
      console.log('📦 Creating ZIP archive...');
      const documentsDir = path.join(os.homedir(), 'Documents');
      const now = new Date();
      const utcTime = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const zipPath = zipOutputPath || path.join(documentsDir, `kensington-konnect-diagnostics-${version.split('.').join('_')}-${utcTime}.zip`);
      
      await createZipArchive(tempDir, zipPath);
      finalOutputPath = zipPath;
      console.log(`✅ ZIP archive created: ${zipPath}`);
    }

    // Prepare result data
    const diagnosticsData: DiagnosticsData = {
      systemInfo,
      usbDevices,
      inputDevices,
      bluetoothDevices,
      version,
      buildDate: new Date().toISOString(),
      hasErrors: errorLogger.hasErrors(),
      errorCount: errorLogger.getLogEntries().length
    };

    return {
      success: true,
      outputPath: finalOutputPath,
      tempDir: createZip ? undefined : tempDir,
      data: diagnosticsData
    };

  } catch (error: any) {
    errorLogger.logError('runDiagnostics', error);
    await errorLogger.saveToFile();
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Individual collector functions for granular control
export async function collectSystemInfoData() {
  return await collectSystemInfo();
}

export async function collectUsbDevicesData() {
  return await collectUsbDevices();
}

export async function collectInputDevicesData() {
  return await collectInputDevices();
}

export async function collectBluetoothDevicesData() {
  return await collectBluetoothDevices();
}

export async function collectLogsData(outputDir: string) {
  return await collectLogs(outputDir);
}

export async function collectCrashReportsData(outputDir: string) {
  return await collectCrashReports(outputDir);
}

// Utility functions
export { createZipArchive } from './utils/zipUtils';
export { errorLogger } from './utils/errorLogger';

// CLI main function (original functionality)
async function main() {
  try {
    console.log('🎯 Kensington Konnect Diagnostics Tool v' + version);
    console.log('🚀 Starting to collect system information and logs...');
    
    const result = await runDiagnostics({
      includeLogs: true,
      includeCrashReports: true,
      includeUsbDevices: true,
      includeInputDevices: true,
      includeBluetoothDevices: true,
      createZip: true
    });

    if (result.success) {
      // Cleanup temp directory if zip was created
      if (result.tempDir && fs.existsSync(result.tempDir)) {
        fs.rmSync(result.tempDir, { recursive: true, force: true });
      }
      
      // Show completion message
      console.log('\n🎉 ============================================');
      console.log('✅ Kensington Konnect Diagnostics Tool completed successfully!');
      console.log('📁 Log file location:');
      console.log(`   ${result.outputPath}`);
      console.log('🎉 ============================================');
      console.log('\n👋 Press any key to exit...');
      
      // Wait for user input before closing
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', () => {
        process.exit(0);
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n👋 Press any key to exit...');
    
    // Wait for user input before closing
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
      process.exit(1);
    });
  }
}

// Only run CLI when this file is executed directly, not when imported as a library
if (require.main === module) {
  main();
} 