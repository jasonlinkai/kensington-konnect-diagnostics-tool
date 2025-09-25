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
    description: 'Output PKG path',
    default: `dist/kensington-konnect-diagnostics-${version}-macos-${arch}.pkg`
  })
  .help()
  .argv;

const CONFIG = {
  EXECUTABLE_PATH: argv.executable,
  OUTPUT_PKG: argv.output,
  TEMP_DIR: `/tmp/pkg_build_${arch}_${Date.now()}`,
  BUNDLE_ID: process.env.BUNDLE_ID,
  PKG_VERSION: versionInfo.version,
  INSTALL_LOCATION: '/Applications/Utilities'
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

async function createPkg() {
  try {
    // Check if executable exists
    if (!fs.existsSync(CONFIG.EXECUTABLE_PATH)) {
      throw new Error(`Executable not found: ${CONFIG.EXECUTABLE_PATH}`);
    }
    
    console.log('🔍 PKG config:');
    console.log(`   Executable: ${CONFIG.EXECUTABLE_PATH}`);
    console.log(`   Output PKG: ${CONFIG.OUTPUT_PKG}`);
    console.log(`   Install location: ${CONFIG.INSTALL_LOCATION}`);
    console.log(`   Package ID: ${CONFIG.BUNDLE_ID}`);
    console.log(`   Version: ${CONFIG.PKG_VERSION}`);
    
    // Create temporary directory structure
    await fs.ensureDir(CONFIG.TEMP_DIR);
    const payloadDir = path.join(CONFIG.TEMP_DIR, 'payload');
    await fs.ensureDir(payloadDir);
    
    // Create the target directory structure in temp
    const targetDir = path.join(payloadDir, 'Applications', 'Utilities');
    await fs.ensureDir(targetDir);
    
    // Copy executable to target location
    const executableName = path.basename(CONFIG.EXECUTABLE_PATH);
    const targetExecutablePath = path.join(targetDir, executableName);
    await fs.copy(CONFIG.EXECUTABLE_PATH, targetExecutablePath);
    
    // Make executable
    await fs.chmod(targetExecutablePath, 0o755);
    
    console.log('📁 Created PKG structure:');
    console.log(`   ${CONFIG.INSTALL_LOCATION}/${executableName}`);
    
    // Create PKG using pkgbuild (unsigned, will be signed separately)
    await spawnPromisify('Build PKG', 'pkgbuild', [
      '--root', payloadDir,
      '--identifier', CONFIG.BUNDLE_ID,
      '--version', CONFIG.PKG_VERSION,
      '--install-location', '/',
      CONFIG.OUTPUT_PKG
    ]);
    
    // Clean up temporary directory
    await fs.remove(CONFIG.TEMP_DIR);
    
    console.log('✅ PKG created successfully!');
    console.log(`📁 Output: ${CONFIG.OUTPUT_PKG}`);
    console.log('🎯 Features:');
    console.log('   - Professional PKG installer');
    console.log('   - Installs to /Applications/Utilities/');
    console.log('   - Ready for signing and notarization');
    
  } catch (error) {
    console.error('❌ PKG creation failed:', error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  await createPkg();
}

if (require.main === module) {
  main();
}

module.exports = { createPkg, CONFIG };
