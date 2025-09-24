import fs from 'fs';
import path from 'path';

interface ErrorLogEntry {
  timestamp: string;
  level: 'ERROR' | 'WARN';
  source: string;
  message: string;
  stack?: string;
  additionalInfo?: any;
}

class ErrorLogger {
  private logEntries: ErrorLogEntry[] = [];
  private tempDir: string | null = null;

  setTempDir(tempDir: string): void {
    this.tempDir = tempDir;
  }

  logError(source: string, error: any, additionalInfo?: any): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      source,
      message: error?.message || String(error),
      stack: error?.stack,
      additionalInfo
    };
    
    this.logEntries.push(entry);
    console.error(`❌ [${source}] Error:`, error?.message || String(error));
  }

  logWarning(source: string, message: string, additionalInfo?: any): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      source,
      message,
      additionalInfo
    };
    
    this.logEntries.push(entry);
    console.warn(`⚠️ [${source}] Warning:`, message);
  }

  async saveToFile(): Promise<void> {
    if (!this.tempDir) {
      throw new Error('Temp directory not set. Call setTempDir() first.');
    }

    if (this.logEntries.length === 0) {
      return; // No errors to log
    }

    const errorLogPath = path.join(this.tempDir, 'error-log.json');
    const errorLogTextPath = path.join(this.tempDir, 'error-log.txt');

    // Save as JSON for structured data
    fs.writeFileSync(errorLogPath, JSON.stringify(this.logEntries, null, 2), 'utf8');

    // Save as human-readable text
    const textContent = this.logEntries.map(entry => {
      let text = `[${entry.timestamp}] ${entry.level} - ${entry.source}\n`;
      text += `Message: ${entry.message}\n`;
      if (entry.stack) {
        text += `Stack Trace:\n${entry.stack}\n`;
      }
      if (entry.additionalInfo) {
        text += `Additional Info: ${JSON.stringify(entry.additionalInfo, null, 2)}\n`;
      }
      text += '---\n';
      return text;
    }).join('\n');

    fs.writeFileSync(errorLogTextPath, textContent, 'utf8');
  }

  getLogEntries(): ErrorLogEntry[] {
    return [...this.logEntries];
  }

  hasErrors(): boolean {
    return this.logEntries.length > 0;
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();
