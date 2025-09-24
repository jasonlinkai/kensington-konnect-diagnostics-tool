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
    description: 'Path to the PKG file to be signed',
    default: `dist/kensington-konnect-diagnostics-${version}-macos-${arch}.pkg`
  })
  .help()
  .argv;

const CONFIG = {
  PKG_PATH: argv.pkg,
  SIGN_IDENTITY: `Developer ID Installer: ${process.env.APPLE_TEAM_NAME} (${process.env.APPLE_TEAM_ID})`,
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID
};

if (!CONFIG.APPLE_TEAM_ID) {
  console.error('❌ Please set APPLE_TEAM_ID environment variable');
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

async function signPkg() {
  try {
    if (!fs.existsSync(CONFIG.PKG_PATH)) {
      throw new Error(`PKG file not found: ${CONFIG.PKG_PATH}`);
    }

    console.log('🔍 PKG Signing config:');
    console.log(`   PKG path: ${CONFIG.PKG_PATH}`);
    console.log(`   Signing identity: ${CONFIG.SIGN_IDENTITY}`);
    console.log(`   Team ID: ${CONFIG.APPLE_TEAM_ID}`);

    // Sign the PKG file
    await spawnPromisify('Sign PKG', 'productsign', [
      '--sign', CONFIG.SIGN_IDENTITY,
      '--timestamp',
      CONFIG.PKG_PATH,
      CONFIG.PKG_PATH + '.signed'
    ]);

    // Replace original with signed version
    fs.renameSync(CONFIG.PKG_PATH + '.signed', CONFIG.PKG_PATH);

    // Verify the signature
    await spawnPromisify('Verify PKG', 'pkgutil', [
      '--check-signature', CONFIG.PKG_PATH
    ]);

    console.log('✅ PKG signing completed successfully!');
    console.log('🎯 Features:');
    console.log('   - PKG file properly signed with Developer ID Installer certificate');
    console.log('   - Ready for notarization and distribution');
    console.log('   - No "檔案損壞" issues for users');

  } catch (error) {
    console.error('❌ PKG signing failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  signPkg();
}

module.exports = { signPkg, CONFIG };
