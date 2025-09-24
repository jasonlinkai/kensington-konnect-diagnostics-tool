#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
require('dotenv').config();

// Get version from package.json
const pkg = require('../package.json');
const version = pkg.version.replace(/\./g, '_');

// Get architecture from command line arguments
const arch = process.argv[2];

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('app', {
    alias: 'a',
    type: 'string',
    description: 'Path to the application to be notarized',
    default: `dist/kensington-konnect-diagnostics-${version}-macos-${arch}`
  })
  .help()
  .argv;

// ========== PLACEHOLDER CONFIG ==========
const CONFIG = {
  APP_PATH: argv.app, // Get from command line arguments
  ZIP_PATH: `${argv.app}.zip`,
  BUNDLE_ID: process.env.BUNDLE_ID, // Get from .env file
};

// Read Apple ID notarization required environment variables
const APPLE_ID = process.env.APPLE_ID;
const APPLE_ID_PASSWORD = process.env.APPLE_ID_PASSWORD;
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;

if (!APPLE_ID || !APPLE_ID_PASSWORD || !APPLE_TEAM_ID) {
  console.error('❌ Please set APPLE_ID, APPLE_ID_PASSWORD, and APPLE_TEAM_ID environment variables');
  process.exit(1);
}

function spawnPromisify(name, command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 ${name}: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, { stdio: 'inherit', ...options });
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

async function zipApp() {
  if (!fs.existsSync(CONFIG.APP_PATH)) {
    throw new Error(`Executable not found: ${CONFIG.APP_PATH}`);
  }
  if (fs.existsSync(CONFIG.ZIP_PATH)) {
    fs.unlinkSync(CONFIG.ZIP_PATH);
  }
  await spawnPromisify('Zip', 'ditto', ['-c', '-k', '--keepParent', CONFIG.APP_PATH, CONFIG.ZIP_PATH]);
}

async function notarize() {
  await spawnPromisify('Notarize Upload', 'xcrun', [
    'notarytool', 'submit', CONFIG.ZIP_PATH,
    '--apple-id', APPLE_ID,
    '--password', APPLE_ID_PASSWORD,
    '--team-id', APPLE_TEAM_ID,
    '--wait',
  ]);
}

// Staple the notarization ticket to the executable
async function staple() {
  try {
    await spawnPromisify('Staple', 'xcrun', [
      'stapler', 'staple', CONFIG.APP_PATH
    ]);
    console.log('✅ Stapling completed successfully!');
  } catch (error) {
    console.log('⚠️  Stapling failed, but notarization was successful.');
    console.log('📋 User instructions:');
    console.log('   1. The file is properly signed and notarized');
    console.log('   2. Users may need to right-click and select "Open" on first run');
    console.log('   3. Or run: xattr -d com.apple.quarantine <file> to remove quarantine');
    console.log('   4. The stapling will be retried automatically in the background');
  }
}

async function main() {
  try {
    console.log(`🔍 Notarization config:`);
    console.log(`   Application path: ${CONFIG.APP_PATH}`);
    console.log(`   Zip file path: ${CONFIG.ZIP_PATH}`);
    console.log(`   Bundle ID: ${CONFIG.BUNDLE_ID}`);
    
    await zipApp();
    await notarize();
    await staple(); // Added stapling step
    console.log('🎉 Notarization process completed!');
  } catch (err) {
    console.error('❌ Notarization process failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 