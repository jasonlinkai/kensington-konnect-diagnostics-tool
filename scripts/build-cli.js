const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const glob = require('glob');

// Read version from package.json
const packageJson = require('../package.json');
const version = packageJson.version;

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
async function build() {
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

// Run build if this script is executed directly
if (require.main === module) {
  build();
}

module.exports = { build, cliConfig };
