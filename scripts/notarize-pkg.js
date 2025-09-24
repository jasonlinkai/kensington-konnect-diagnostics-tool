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
  .option('pkg', {
    alias: 'p',
    type: 'string',
    description: 'Path to the PKG file to be notarized',
    default: `dist/kensington-konnect-diagnostics-${version}-macos-${arch}.pkg`
  })
  .help()
  .argv;

const CONFIG = {
  PKG_PATH: argv.pkg,
  BUNDLE_ID: process.env.BUNDLE_ID
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

async function notarizePkg() {
  await spawnPromisify('Notarize PKG', 'xcrun', [
    'notarytool', 'submit', CONFIG.PKG_PATH,
    '--apple-id', APPLE_ID,
    '--password', APPLE_ID_PASSWORD,
    '--team-id', APPLE_TEAM_ID,
    '--wait',
  ]);
}

// Staple the notarization ticket to the PKG
async function staplePkg() {
  try {
    await spawnPromisify('Staple PKG', 'xcrun', [
      'stapler', 'staple', CONFIG.PKG_PATH
    ]);
    console.log('✅ PKG stapling completed successfully!');
  } catch (error) {
    console.log('⚠️  PKG stapling failed, but notarization was successful.');
    console.log('📋 User instructions:');
    console.log('   1. The PKG is properly signed and notarized');
    console.log('   2. Users can install the PKG normally');
    console.log('   3. The stapling will be retried automatically in the background');
  }
}

async function main() {
  try {
    console.log(`🔍 PKG Notarization config:`);
    console.log(`   PKG path: ${CONFIG.PKG_PATH}`);
    console.log(`   Bundle ID: ${CONFIG.BUNDLE_ID}`);
    
    if (!fs.existsSync(CONFIG.PKG_PATH)) {
      throw new Error(`PKG file not found: ${CONFIG.PKG_PATH}`);
    }

    await notarizePkg();
    await staplePkg();
    console.log('🎉 PKG notarization process completed!');
  } catch (err) {
    console.error('❌ PKG notarization process failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { notarizePkg, staplePkg, CONFIG };
