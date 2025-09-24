const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Read version from package.json
const packageJson = require('../package.json');
const version = packageJson.version;

// Build configurations for different module formats
const libraryConfigs = {
  // CommonJS format
  cjs: {
    entryPoints: ['src/index.ts'],
    outfile: 'libs/index.cjs',
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    sourcemap: true,
    bundle: true,
    external: ['node-hid', 'usb-detection'],
    define: {
      'process.env.BUILD_VERSION': `"${version}"`
    }
  },
  
  // ES Modules format
  esm: {
    entryPoints: ['src/index.ts'],
    outfile: 'libs/index.esm.js',
    platform: 'node',
    target: 'node18',
    format: 'esm',
    sourcemap: true,
    bundle: true,
    external: ['node-hid', 'usb-detection'],
    define: {
      'process.env.BUILD_VERSION': `"${version}"`
    }
  }
};

// Build function for libraries
async function buildLibs() {
  try {
    console.log(`📦 Building libraries with esbuild (version: ${version})...`);
    
    // Ensure libs directory exists
    if (!fs.existsSync('libs')) {
      fs.mkdirSync('libs', { recursive: true });
    }
    
    const outputFiles = [];
    
    // Build CommonJS
    console.log('  📦 Building CommonJS (CJS)...');
    await esbuild.build(libraryConfigs.cjs);
    outputFiles.push('CJS: libs/index.cjs');
    
    // Build ES Modules
    console.log('  📦 Building ES Modules (ESM)...');
    await esbuild.build(libraryConfigs.esm);
    outputFiles.push('ESM: libs/index.esm.js');
    
    console.log('✅ Library build completed successfully');
    console.log('📁 Output files:');
    outputFiles.forEach(file => console.log(`  ${file}`));
    
  } catch (error) {
    console.error('❌ Library build failed:', error);
    process.exit(1);
  }
}

// Run build if this script is executed directly
if (require.main === module) {
  buildLibs();
}

module.exports = { buildLibs, libraryConfigs };
