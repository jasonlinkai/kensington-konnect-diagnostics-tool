import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { spawn } from 'child_process';
import { errorLogger } from '../utils/errorLogger';

const execAsync = promisify(exec);

// Kensington application name list
const KENSINGTON_APPS = [
  'Kensington Konnect',
  'KensingtonKonductor-TB',
  'KensingtonKonductor-DK',
  'Konnect',
  'Konductor',
  'Kensington'
];

// Check if file contains Kensington application
function isKensingtonCrashReport(fileName: string): boolean {
  const lowerFileName = fileName.toLowerCase();
  return KENSINGTON_APPS.some(app => 
    lowerFileName.includes(app.toLowerCase().replace(/\s+/g, ''))
  );
}

// macOS crash report collection logic
async function collectMacOSCrashReports(targetDir: string): Promise<void> {
  const crashOutDir = path.join(targetDir, 'crash_reports');
  if (!fs.existsSync(crashOutDir)) fs.mkdirSync(crashOutDir, { recursive: true });
  
  // macOS crash report paths
  const crashPaths = [
    path.join(os.homedir(), 'Library/Logs/DiagnosticReports'),
  ];
  
  for (const crashPath of crashPaths) {
    if (fs.existsSync(crashPath)) {
      const files = fs.readdirSync(crashPath)
        .filter(f => {
          const isValidType = f.endsWith('.dmp') || f.endsWith('.txt') || f.endsWith('.log') || f.endsWith('.crash') || f.endsWith('.ips');
          // Only collect Kensington related crash reports
          return isValidType && isKensingtonCrashReport(f);
        })
        .sort((a, b) => fs.statSync(path.join(crashPath, b)).mtimeMs - fs.statSync(path.join(crashPath, a)).mtimeMs)
        .slice(0, 3);
      
      for (const file of files) {
        fs.copyFileSync(path.join(crashPath, file), path.join(crashOutDir, file));
      }
    }
  }
}

async function getWindowsEventLogsPowerShell(targetDir: string): Promise<void> {
  try {
    // 動態組合關鍵字條件，收集 Application Error 來源且訊息內有 Kensington 關鍵字的事件
    const keywordPattern = KENSINGTON_APPS.map(app => app.replace(/'/g, "''")).join('|');
    // 創建 PowerShell 腳本檔案
    const psScriptContent = `
$keywordPattern = '${keywordPattern}'
$events = Get-WinEvent -LogName Application -MaxEvents 1000 | Where-Object { 
  ( ($_.ProviderName -eq 'Application Error' -and $_.Message -match $keywordPattern) -or 
    ($_.Message -match $keywordPattern -or $_.ProviderName -match $keywordPattern) ) -and 
  $_.TimeCreated -gt (Get-Date).AddDays(-30) 
}

foreach ($event in $events) {
  Write-Host "=== Event Details ==="
  Write-Host "TimeCreated: $($event.TimeCreated)"
  Write-Host "Id: $($event.Id)"
  Write-Host "Level: $($event.Level)"
  Write-Host "LevelDisplayName: $($event.LevelDisplayName)"
  Write-Host "ProviderName: $($event.ProviderName)"
  Write-Host "Source: $($event.Source)"
  Write-Host "MachineName: $($event.MachineName)"
  Write-Host "UserName: $($event.UserName)"
  Write-Host "ProcessId: $($event.ProcessId)"
  Write-Host "ThreadId: $($event.ThreadId)"
  Write-Host "Task: $($event.Task)"
  Write-Host "TaskDisplayName: $($event.TaskDisplayName)"
  Write-Host "Opcode: $($event.Opcode)"
  Write-Host "OpcodeDisplayName: $($event.OpcodeDisplayName)"
  Write-Host "Keywords: $($event.Keywords)"
  Write-Host "KeywordsDisplayNames: $($event.KeywordsDisplayNames)"
  Write-Host "Message: $($event.Message)"
  Write-Host "Properties Count: $($event.Properties.Count)"
  
  if ($event.Properties.Count -gt 0) {
    Write-Host "Properties:"
    for ($i = 0; $i -lt $event.Properties.Count; $i++) {
      Write-Host ("  [" + $i + "]: " + $event.Properties[$i].Value)
    }
  }
  Write-Host "=================="
  Write-Host ""
}
`;
    
    const psScriptPath = path.join(targetDir, 'temp_script.ps1');
    fs.writeFileSync(psScriptPath, psScriptContent, 'utf8');
    
    const psScript = `powershell.exe -ExecutionPolicy Bypass -File "${psScriptPath}"`;
    
    const { stdout, stderr } = await execAsync(
      `powershell.exe -NoProfile -Command "${psScript}"`,
      { encoding: 'utf8' }
    );
    
    // console.log('PowerShell stdout length:', stdout.length);
    // console.log('PowerShell stderr:', stderr);
    // console.log('PowerShell output preview:', stdout.substring(0, 200) + (stdout.length > 200 ? '...' : ''));
    
    const crashOutDir = path.join(targetDir, 'crash_reports');
    if (!fs.existsSync(crashOutDir)) fs.mkdirSync(crashOutDir, { recursive: true });
    fs.writeFileSync(path.join(crashOutDir, 'windows_event_logs.txt'), stdout, 'utf-8');
  } catch (error) {
    errorLogger.logError('crashReports-powershell', error);
    console.error('PowerShell execution error:', error);
    const crashOutDir = path.join(targetDir, 'crash_reports');
    if (!fs.existsSync(crashOutDir)) fs.mkdirSync(crashOutDir, { recursive: true });
    fs.writeFileSync(path.join(crashOutDir, 'windows_event_logs_error.txt'), String(error), 'utf-8');
  }
}

// Windows crash report collection logic
async function collectWindowsCrashReports(targetDir: string): Promise<void> {
  const crashOutDir = path.join(targetDir, 'crash_reports');
  if (!fs.existsSync(crashOutDir)) fs.mkdirSync(crashOutDir, { recursive: true });
  
  console.log('📋 Collecting Windows Event Log entries for Kensington applications...');
  
  // 直接用純文字格式收集
  await getWindowsEventLogsPowerShell(targetDir);
}

export async function collectCrashReports(targetDir: string): Promise<void> {
  const platform = process.platform;
  
  if (platform === 'win32') {
    // Windows crash report collection
    await collectWindowsCrashReports(targetDir);
  } else if (platform === 'darwin') {
    // macOS crash report collection
    await collectMacOSCrashReports(targetDir);
  } else {
    // Other platforms (Linux, etc.)
    console.log('ℹ️ Crash report collection not implemented for this platform');
  }
} 