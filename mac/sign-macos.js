#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
require('dotenv').config();

// Read version from package.json
const packageJson = require('../package.json');
const version = packageJson.version.split('.').join('_');

// Get architecture from command line arguments
const arch = process.argv[2];

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('app', {
    alias: 'a',
    type: 'string',
    description: 'Path to the application to be signed',
    default: `dist/kensington-konnect-diagnostics-${version}-macos-${arch}`
  })
  .help()
  .argv;

// ========================================
// Please modify your signing information here
// ========================================
const SIGN_CONFIG = {
  // Signing identity - get from .env file
  SIGN_IDENTITY: `Developer ID Application: ${process.env.APPLE_TEAM_NAME} (${process.env.APPLE_TEAM_ID})`,
  
  // Developer Team ID - get from .env file
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
  
  // Path to the file to be signed (from command line arguments)
  APP_PATH: argv.app
};

// ========================================
// Entitlements file path (fixed)
// ========================================
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

// Sign application
async function signApp() {
  try {
    // Check if file exists
    if (!fs.existsSync(SIGN_CONFIG.APP_PATH)) {
      throw new Error(`File does not exist: ${SIGN_CONFIG.APP_PATH}`);
    }
    
    // Check if entitlements file exists
    if (!fs.existsSync(ENTITLEMENTS_PATH)) {
      throw new Error(`Entitlements file does not exist: ${ENTITLEMENTS_PATH}`);
    }
    
    console.log('🔍 Signing config:');
    console.log(`   Signing identity: ${SIGN_CONFIG.SIGN_IDENTITY}`);
    console.log(`   Team ID: ${SIGN_CONFIG.APPLE_TEAM_ID}`);
    console.log(`   File path: ${SIGN_CONFIG.APP_PATH}`);
    console.log(`   Entitlements file: ${ENTITLEMENTS_PATH}`);
    
    // Prepare codesign arguments
    const codesignArgs = [
      '--sign', SIGN_CONFIG.SIGN_IDENTITY,
      '--entitlements', ENTITLEMENTS_PATH,
      '--options', 'runtime',
      '--force',
      '--timestamp',
      '--verbose',
      '--identifier', process.env.BUNDLE_ID,
      SIGN_CONFIG.APP_PATH
    ];
    
    // Execute signing
    await spawnPromisify('codesign', 'codesign', codesignArgs);
    
    // Verify signature
    console.log('🔍 Verifying signature...');
    await spawnPromisify('codesign-verify', 'codesign', ['--verify', '--verbose', SIGN_CONFIG.APP_PATH]);
    
    // Show signature info
    console.log('📋 Signature info:');
    await spawnPromisify('codesign-info', 'codesign', ['--display', '--verbose', SIGN_CONFIG.APP_PATH]);
    
    console.log('✅ Signing completed!');
    
  } catch (error) {
    console.error('❌ Signing failed:', error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  await signApp();
}

if (require.main === module) {
  main();
}

module.exports = { signApp, SIGN_CONFIG }; 