#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
require('dotenv').config();

// Get version information
const { getVersion } = require('./getVersion');
const versionInfo = getVersion();
const version = versionInfo.versionUnderscore;

// Get architecture from command line arguments
const arch = process.argv[2];

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('executable', {
    alias: 'e',
    type: 'string',
    description: 'Path to the executable to be packaged',
    default: `dist/kensington-konnect-diagnostics-${version}-macos-${arch}`
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'Output APP path',
    default: `dist/kensington-konnect-diagnostics-${version}-macos-${arch}.app`
  })
  .help()
  .argv;

const CONFIG = {
  EXECUTABLE_PATH: argv.executable,
  OUTPUT_APP: argv.output,
  BUNDLE_ID: process.env.BUNDLE_ID || 'com.kensington.konnect.diagnostics',
  APP_VERSION: versionInfo.version,
  APP_NAME: 'Kensington Konnect Diagnostics'
};

async function createApp() {
  try {
    // Check if executable exists
    if (!fs.existsSync(CONFIG.EXECUTABLE_PATH)) {
      throw new Error(`Executable not found: ${CONFIG.EXECUTABLE_PATH}`);
    }
    
    console.log('🔍 APP config:');
    console.log(`   Executable: ${CONFIG.EXECUTABLE_PATH}`);
    console.log(`   Output APP: ${CONFIG.OUTPUT_APP}`);
    console.log(`   Bundle ID: ${CONFIG.BUNDLE_ID}`);
    console.log(`   Version: ${CONFIG.APP_VERSION}`);
    
    // Create .app bundle structure
    const appContentsDir = path.join(CONFIG.OUTPUT_APP, 'Contents');
    const appMacOSDir = path.join(appContentsDir, 'MacOS');
    const appResourcesDir = path.join(appContentsDir, 'Resources');
    
    await fs.ensureDir(appMacOSDir);
    await fs.ensureDir(appResourcesDir);
    
    // Copy executable to MacOS directory
    const executableName = CONFIG.APP_NAME;
    const targetExecutablePath = path.join(appMacOSDir, executableName);
    await fs.copy(CONFIG.EXECUTABLE_PATH, targetExecutablePath);
    
    // Make executable
    await fs.chmod(targetExecutablePath, 0o755);
    
    // Copy app icon to Resources directory
    const iconSourcePath = path.join(__dirname, '..', 'resources', 'appIcon.icns');
    if (fs.existsSync(iconSourcePath)) {
      const iconTargetPath = path.join(appResourcesDir, 'appIcon.icns');
      await fs.copy(iconSourcePath, iconTargetPath);
      console.log('✅ App icon copied successfully');
    } else {
      console.log('⚠️  App icon not found at:', iconSourcePath);
    }
    
    // Create Info.plist
    const infoPlist = {
      CFBundleExecutable: executableName,
      CFBundleIdentifier: CONFIG.BUNDLE_ID,
      CFBundleName: CONFIG.APP_NAME,
      CFBundleDisplayName: CONFIG.APP_NAME,
      CFBundleVersion: CONFIG.APP_VERSION,
      CFBundleShortVersionString: CONFIG.APP_VERSION,
      CFBundlePackageType: 'APPL',
      CFBundleSignature: '????',
      LSMinimumSystemVersion: '10.15.0',
      NSHighResolutionCapable: true,
      NSRequiresAquaSystemAppearance: false,
      CFBundleIconFile: 'appIcon.icns'
    };
    
    const plistPath = path.join(appContentsDir, 'Info.plist');
    await fs.writeFile(plistPath, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
${Object.entries(infoPlist).map(([key, value]) => {
  const valueStr = typeof value === 'boolean' ? (value ? '<true/>' : '<false/>') : `<string>${value}</string>`;
  return `\t<key>${key}</key>\n\t${valueStr}`;
}).join('\n')}
</dict>
</plist>`);
    
    console.log('✅ APP created successfully!');
    console.log(`📁 Output: ${CONFIG.OUTPUT_APP}`);
    console.log('🎯 Features:');
    console.log('   - Native macOS .app bundle');
    console.log('   - Ready for signing and notarization');
    console.log('   - Can be zipped directly for distribution');
    
  } catch (error) {
    console.error('❌ APP creation failed:', error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  await createApp();
}

if (require.main === module) {
  main();
}

module.exports = { createApp, CONFIG };
