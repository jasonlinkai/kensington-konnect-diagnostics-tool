import fs from 'fs';
import path from 'path';
import os from 'os';
import { errorLogger } from '../utils/errorLogger';

// Log path configuration interface
interface LogPathConfig {
  folderPath: string;
  pattern?: RegExp; // Optional pattern for file matching
}

// Extensible application log paths
const LOG_PATHS: Record<string, LogPathConfig[]> = {
  'darwin': [
    { folderPath: path.join(os.homedir(), 'Library/Preferences/Konductor2') }, // Back-end Database
    { folderPath: path.join(os.homedir(), 'Library/Logs/Konductor2') }, // Back-end Logs
    { folderPath: path.join(os.homedir(), 'Library/Kensington Konnect™/log') }, // Front-end Logs
    { 
      folderPath: path.join(os.homedir(), 'Library/Logs'),  // Back-end Keyboard Logs
      pattern: /konductor_\d+\.log$/ 
    },
    { 
      folderPath: path.join(os.homedir(), 'Library/Preferences'), // Back-end Keyboard Settings
      pattern: /KkbSettings.json$/ 
    },
  ],
  'win32': [
    { folderPath: path.join(os.homedir(), 'AppData/Roaming/Kensington/Konductor2') }, // Back-end Database and Logs
    { folderPath: path.join(os.homedir(), 'AppData/Roaming/Kensington/Konductor') }, // Back-end keyboard Database and Logs
    { folderPath: path.join(os.homedir(), 'AppData/Roaming/KensingtonKonnect/log') }, // Front-end Logs
  ]
};

function copyDirSync(src: string, dest: string, pattern?: RegExp) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      // If pattern is specified, only copy directories if we're not filtering by pattern
      // For pattern matching, we only want files, not directories
      if (!pattern) {
        copyDirSync(srcPath, destPath, pattern);
      }
    } else {
      // If it's a file, check if it matches the pattern (if provided)
      if (pattern) {
        if (pattern.test(entry)) {
          fs.copyFileSync(srcPath, destPath);
        }
      } else {
        // No pattern specified, copy all files
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

export async function collectLogs(targetDir: string): Promise<void> {
  try {
    const platform = process.platform;
    const logPathConfigs = LOG_PATHS[platform] || [];
    const logsOutDir = path.join(targetDir, 'logs');
    
    for (const config of logPathConfigs) {
      try {
        if (fs.existsSync(config.folderPath)) {
          // Generate a meaningful destination folder name
          const appName = path.basename(config.folderPath);
          const dest = path.join(logsOutDir, appName);
          
          // Copy with pattern matching if specified
          copyDirSync(config.folderPath, dest, config.pattern);
        }
      } catch (error) {
        errorLogger.logError('logs-copy', error, { 
          folderPath: config.folderPath, 
          pattern: config.pattern?.toString() 
        });
      }
    }
  } catch (error) {
    errorLogger.logError('logs', error);
  }
} 