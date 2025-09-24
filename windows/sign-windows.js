#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
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
    default: `dist/kensington-konnect-diagnostics-${version}-win-${arch}.exe`
  })
  .option('keypair-alias', {
    alias: 'k',
    type: 'string',
    description: 'Keypair alias for signing',
    default: process.env.SMCTL_KEYPAIR_ALIAS || 'YOUR_KEYPAIR_ALIAS'
  })

  .help()
  .argv;

// ========================================
// Windows signing config
// ========================================
const SIGN_CONFIG = {
  // Path to the file to be signed (from command line arguments)
  APP_PATH: argv.app,
  
  // Keypair alias for signing (from command line arguments or environment variable)
  KEYPAIR_ALIAS: argv.keypairAlias
};

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

// Check if smctl tool is available
async function checkSmctl() {
  try {
    await spawnPromisify('Check smctl', 'smctl', ['--version'], { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.error('❌ smctl tool is not available, please make sure it is installed and in PATH');
    return false;
  }
}

// Sign Windows binary file
async function signWindowsBinary() {
  try {
    // Check if file exists
    if (!fs.existsSync(SIGN_CONFIG.APP_PATH)) {
      throw new Error(`File does not exist: ${SIGN_CONFIG.APP_PATH}`);
    }

    // Check smctl tool
    const smctlAvailable = await checkSmctl();
    if (!smctlAvailable) {
      throw new Error('smctl tool is not available');
    }

    // Check keypair alias
    if (!SIGN_CONFIG.KEYPAIR_ALIAS || SIGN_CONFIG.KEYPAIR_ALIAS === 'YOUR_KEYPAIR_ALIAS') {
      throw new Error('Please provide a valid keypair alias (--keypair-alias argument or SMCTL_KEYPAIR_ALIAS environment variable)');
    }

    console.log('🔍 Windows signing config:');
    console.log(`   File path: ${SIGN_CONFIG.APP_PATH}`);
    console.log(`   Keypair alias: ${SIGN_CONFIG.KEYPAIR_ALIAS}`);

    // Prepare smctl signing arguments
    const smctlArgs = [
      'sign',
      '--verbose',
      '--keypair-alias', SIGN_CONFIG.KEYPAIR_ALIAS,
      '--input', SIGN_CONFIG.APP_PATH
    ];

    // Execute signing
    await spawnPromisify('smctl sign', 'smctl', smctlArgs);

    console.log('✅ Windows signing completed!');

  } catch (error) {
    console.error('❌ Windows signing failed:', error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  await signWindowsBinary();
}

if (require.main === module) {
  main();
}

module.exports = { signWindowsBinary, SIGN_CONFIG }; 