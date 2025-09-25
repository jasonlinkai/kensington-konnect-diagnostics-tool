#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
require('dotenv').config();

// Get version information
const { getVersion } = require('./getVersion');
const versionInfo = getVersion();
const version = versionInfo.versionUnderscore;

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('file', {
    alias: 'f',
    type: 'string',
    description: 'Path to the file to be signed'
  })
  .option('type', {
    alias: 't',
    type: 'string',
    choices: ['app', 'pkg', 'executable'],
    description: 'Type of file to sign',
    default: 'app'
  })
  .option('arch', {
    alias: 'a',
    type: 'string',
    description: 'Architecture (x64, arm64)',
    default: 'x64'
  })
  .help()
  .argv;

// Get architecture from command line arguments
const arch = argv.arch;

// Auto-detect file path if not provided
function getDefaultFilePath(type, arch) {
  const baseName = `kensington-konnect-diagnostics-${version}-macos-${arch}`;
  switch (type) {
    case 'app':
      return `dist/${baseName}.app`;
    case 'pkg':
      return `dist/${baseName}.pkg`;
    case 'executable':
      return `dist/${baseName}`;
    default:
      return `dist/${baseName}.app`;
  }
}

const CONFIG = {
  FILE_PATH: argv.file || getDefaultFilePath(argv.type, arch),
  TYPE: argv.type,
  SIGN_IDENTITY: argv.type === 'pkg' 
    ? `Developer ID Installer: ${process.env.APPLE_TEAM_NAME} (${process.env.APPLE_TEAM_ID})`
    : `Developer ID Application: ${process.env.APPLE_TEAM_NAME} (${process.env.APPLE_TEAM_ID})`,
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
  BUNDLE_ID: process.env.BUNDLE_ID
};

// Entitlements file path (for app and executable)
const ENTITLEMENTS_PATH = path.resolve(process.cwd(), 'mac/kensington-konnect-diagnostics.entitlements');

// Promise wrapper for executing commands
function spawnPromisify(name, command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 ${name}: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${name} completed`);
        resolve();
      } else {
        console.error(`❌ ${name} failed, exit code: ${code}`);
        reject(new Error(`${name} failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`❌ ${name} error:`, error.message);
      reject(error);
    });
  });
}

// Sign different types of files
async function signFile() {
  try {
    // Check if file exists
    if (!fs.existsSync(CONFIG.FILE_PATH)) {
      throw new Error(`File does not exist: ${CONFIG.FILE_PATH}`);
    }
    
    console.log('🔍 Signing config:');
    console.log(`   File path: ${CONFIG.FILE_PATH}`);
    console.log(`   File type: ${CONFIG.TYPE}`);
    console.log(`   Signing identity: ${CONFIG.SIGN_IDENTITY}`);
    console.log(`   Team ID: ${CONFIG.APPLE_TEAM_ID}`);
    
    if (CONFIG.TYPE === 'pkg') {
      // Sign PKG file
      await spawnPromisify('Sign PKG', 'productsign', [
        '--sign', CONFIG.SIGN_IDENTITY,
        '--timestamp',
        CONFIG.FILE_PATH,
        CONFIG.FILE_PATH + '.signed'
      ]);
      
      // Replace original with signed version
      fs.renameSync(CONFIG.FILE_PATH + '.signed', CONFIG.FILE_PATH);
      
      // Verify PKG signature
      await spawnPromisify('Verify PKG', 'pkgutil', [
        '--check-signature', CONFIG.FILE_PATH
      ]);
      
    } else {
      // Sign APP or executable file
      if (!fs.existsSync(ENTITLEMENTS_PATH)) {
        throw new Error(`Entitlements file does not exist: ${ENTITLEMENTS_PATH}`);
      }
      
      const codesignArgs = [
        '--sign', CONFIG.SIGN_IDENTITY,
        '--entitlements', ENTITLEMENTS_PATH,
        '--options', 'runtime',
        '--force',
        '--timestamp',
        '--verbose',
        '--identifier', CONFIG.BUNDLE_ID,
        CONFIG.FILE_PATH
      ];
      
      // Execute signing
      await spawnPromisify('codesign', 'codesign', codesignArgs);
      
      // Verify signature
      console.log('🔍 Verifying signature...');
      await spawnPromisify('codesign-verify', 'codesign', ['--verify', '--verbose', CONFIG.FILE_PATH]);
      
      // Show signature info
      console.log('📋 Signature info:');
      await spawnPromisify('codesign-info', 'codesign', ['--display', '--verbose', CONFIG.FILE_PATH]);
    }
    
    console.log(`✅ ${CONFIG.TYPE.toUpperCase()} signing completed!`);
    
  } catch (error) {
    console.error(`❌ ${CONFIG.TYPE.toUpperCase()} signing failed:`, error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  await signFile();
}

if (require.main === module) {
  main();
}

module.exports = { signFile, CONFIG };
