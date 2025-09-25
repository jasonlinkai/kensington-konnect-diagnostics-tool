#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const glob = require('glob');

// Get version information
const { getVersion } = require('./getVersion');
const versionInfo = getVersion();
const version = versionInfo.version;

// Build configuration for CLI (with shebang)
const cliConfig = {
  entryPoints: glob.sync('src/**/*.ts'),
  outdir: 'dist',
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  sourcemap: true,
  define: {
    'process.env.BUILD_VERSION': `"${version}"`
  },
  banner: {
    js: '#!/usr/bin/env node'
  }
};

// Build function for CLI only
async function buildCLI() {
  try {
    console.log(`🛠️ Building CLI with esbuild (version: ${version})...`);
    
    // Ensure dist directory exists
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist', { recursive: true });
    }
    
    // Build CLI version (for executable)
    await esbuild.build(cliConfig);
    
    console.log('✅ CLI build completed successfully');
    console.log('📁 Output file: dist/index.js');
  } catch (error) {
    console.error('❌ CLI build failed:', error);
    process.exit(1);
  }
}

// Main function
async function main() {
  await buildCLI();
}

if (require.main === module) {
  main();
}

module.exports = { buildCLI, cliConfig };
