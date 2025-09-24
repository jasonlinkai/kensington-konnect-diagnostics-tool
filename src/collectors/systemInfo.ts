import si from 'systeminformation';
import os from 'os';
import { SystemInfo } from '../types';
import { errorLogger } from '../utils/errorLogger';

export async function collectSystemInfo(): Promise<SystemInfo> {
  try {
    const [cpu, mem, osInfo, time] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo(),
      si.time()
    ]);

    const systemInfo: SystemInfo = {
      os: osInfo.platform,
      osVersion: osInfo.release,
      cpuArchitecture: cpu.physicalCores ? `${cpu.physicalCores}-core ${cpu.manufacturer} ${cpu.brand}` : 'Unknown',
      platform: osInfo.platform,
      totalMemory: mem.total,
      freeMemory: mem.free,
      cpuCount: cpu.physicalCores || 0,
      uptime: time.uptime,
      timestamp: new Date().toISOString()
    };

    return systemInfo;
  } catch (error) {
    errorLogger.logError('systemInfo', error, { fallbackUsed: true });
    console.warn('⚠️ Unable to collect complete system information, using basic info:', error);
    
    // Fallback to basic system information
    const fallbackInfo: SystemInfo = {
      os: process.platform,
      osVersion: os.release(),
      cpuArchitecture: process.arch,
      platform: process.platform,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuCount: os.cpus().length,
      uptime: os.uptime(),
      timestamp: new Date().toISOString()
    };

    return fallbackInfo;
  }
} 