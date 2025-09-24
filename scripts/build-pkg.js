#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const target = args[0]; // e.g., 'macos-x64', 'macos-arm64', 'win-x64'

if (!target) {
  console.error('❌ Error: Target platform is required');
  console.log('Usage: node scripts/build-pkg.js <target>');
  console.log('Available targets:');
  console.log('  - macos-x64');
  console.log('  - macos-arm64');
  console.log('  - win-x64');
  process.exit(1);
}

// Validate target
const validTargets = ['macos-x64', 'macos-arm64', 'win-x64'];
if (!validTargets.includes(target)) {
  console.error(`❌ Error: Invalid target "${target}"`);
  console.log('Valid targets:', validTargets.join(', '));
  process.exit(1);
}

// Get version from package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = pkg.version.replace(/\./g, '_');

// Map targets to pkg targets
const targetMap = {
  'macos-x64': 'node18-macos-x64',
  'macos-arm64': 'node18-macos-arm64',
  'win-x64': 'node18-win-x64'
};

// Map targets to output file extensions
const extensionMap = {
  'macos-x64': '',
  'macos-arm64': '',
  'win-x64': '.exe'
};

const pkgTarget = targetMap[target];
const extension = extensionMap[target];
const outputName = `kensington-konnect-diagnostics-${version}-${target}${extension}`;
const outputPath = path.join(__dirname, '..', 'dist', outputName);

console.log('🔧 Building with pkg...');
console.log(`   Target: ${pkgTarget}`);
console.log(`   Output: ${outputPath}`);
console.log(`   Version: ${pkg.version} (${version})`);

try {
  // Build the executable
  const pkgCommand = `pkg dist/index.js --targets ${pkgTarget} --output "${outputPath}" --config pkg.json`;
  console.log(`   Command: ${pkgCommand}`);
  
  execSync(pkgCommand, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✅ Build completed successfully!');
  console.log(`📁 Output file: ${outputPath}`);
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
