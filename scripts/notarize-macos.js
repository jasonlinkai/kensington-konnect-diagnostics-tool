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
    description: 'Path to the file to be notarized'
  })
  .option('type', {
    alias: 't',
    type: 'string',
    choices: ['app', 'pkg', 'executable'],
    description: 'Type of file to notarize',
    default: 'app'
  })
  .option('arch', {
    alias: 'a',
    type: 'string',
    description: 'Architecture (x64, arm64)',
    default: 'x64'
  })
  .option('staple', {
    alias: 's',
    type: 'boolean',
    description: 'Whether to staple the notarization ticket (default: true)',
    default: true
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
  ZIP_PATH: `${argv.file || getDefaultFilePath(argv.type, arch)}.zip`,
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

async function zipFile() {
  if (!fs.existsSync(CONFIG.FILE_PATH)) {
    throw new Error(`File not found: ${CONFIG.FILE_PATH}`);
  }
  if (fs.existsSync(CONFIG.ZIP_PATH)) {
    fs.unlinkSync(CONFIG.ZIP_PATH);
  }
  
  if (CONFIG.TYPE === 'pkg') {
    // For PKG files, submit directly without zipping
    CONFIG.ZIP_PATH = CONFIG.FILE_PATH;
  } else {
    // For APP and executable files, zip them
    await spawnPromisify('Zip', 'ditto', ['-c', '-k', '--keepParent', CONFIG.FILE_PATH, CONFIG.ZIP_PATH]);
  }
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

// Staple the notarization ticket to the file
async function staple() {
  try {
    await spawnPromisify('Staple', 'xcrun', [
      'stapler', 'staple', CONFIG.FILE_PATH
    ]);
    console.log(`✅ ${CONFIG.TYPE.toUpperCase()} stapling completed successfully!`);
  } catch (error) {
    console.log(`⚠️  ${CONFIG.TYPE.toUpperCase()} stapling failed, but notarization was successful.`);
    console.log('📋 User instructions:');
    if (CONFIG.TYPE === 'app') {
      console.log('   📱 1. The app bundle is properly signed and notarized');
      console.log('   🔓 2. Users may need to right-click and select "Open" on first run');
      console.log('   🛠️ 3. Or run: xattr -d com.apple.quarantine <app> to remove quarantine');
    } else if (CONFIG.TYPE === 'pkg') {
      console.log('   📦 1. The PKG is properly signed and notarized');
      console.log('   ✅ 2. Users can install the PKG normally');
    } else {
      console.log('   ⚙️ 1. The executable is properly signed and notarized');
      console.log('   🔓 2. Users may need to right-click and select "Open" on first run');
    }
    console.log('   🔄 4. The stapling will be retried automatically in the background');
  }
}

async function main() {
  try {
    console.log(`🔍 ${CONFIG.TYPE.toUpperCase()} Notarization config:`);
    console.log(`   File path: ${CONFIG.FILE_PATH}`);
    console.log(`   Zip file path: ${CONFIG.ZIP_PATH}`);
    console.log(`   Bundle ID: ${CONFIG.BUNDLE_ID}`);
    console.log(`   Staple: ${argv.staple}`);
    
    await zipFile();
    await notarize();
    
    if (argv.staple) {
      await staple();
    } else {
      console.log('⏭️  Skipping staple process (--no-staple specified)');
      console.log('📋 User instructions:');
      if (CONFIG.TYPE === 'app') {
        console.log('   📱 1. The app bundle is properly signed and notarized');
        console.log('   🔓 2. Users may need to right-click and select "Open" on first run');
        console.log('   🛠️ 3. Or run: xattr -d com.apple.quarantine <app> to remove quarantine');
      } else if (CONFIG.TYPE === 'pkg') {
        console.log('   📦 1. The PKG is properly signed and notarized');
        console.log('   ✅ 2. Users can install the PKG normally');
      } else {
        console.log('   ⚙️ 1. The executable is properly signed and notarized');
        console.log('   🔓 2. Users may need to right-click and select "Open" on first run');
      }
    }
    
    console.log(`🎉 ${CONFIG.TYPE.toUpperCase()} notarization process completed!`);
  } catch (err) {
    console.error(`❌ ${CONFIG.TYPE.toUpperCase()} notarization process failed:`, err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { notarize, staple, CONFIG };
