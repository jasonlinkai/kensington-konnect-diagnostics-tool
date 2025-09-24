const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Generate TypeScript declaration files
function generateTypeDeclarations() {
  console.log('  📝 Generating TypeScript declaration files...');
  
  try {
    // Create a custom tsconfig for libs build
    const libsTsConfig = {
      compilerOptions: {
        target: "ES2020",
        module: "commonjs",
        lib: ["ES2020", "DOM"],
        outDir: "./libs",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        declarationMap: true,
        emitDeclarationOnly: true,
        removeComments: false,
        noImplicitAny: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedIndexedAccess: true,
        types: ["node"]
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"]
    };
    
    // Write temporary tsconfig for libs
    const tempTsConfigPath = 'tsconfig.libs.json';
    fs.writeFileSync(tempTsConfigPath, JSON.stringify(libsTsConfig, null, 2));
    
    // Run TypeScript compiler to generate declaration files
    execSync(`npx tsc --project ${tempTsConfigPath}`, { stdio: 'inherit' });
    
    // Clean up temp config
    fs.unlinkSync(tempTsConfigPath);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to generate TypeScript declarations:', error.message);
    return false;
  }
}

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
    
    // Generate TypeScript declaration files
    const declarationsGenerated = generateTypeDeclarations();
    if (declarationsGenerated) {
      outputFiles.push('Types: libs/index.d.ts');
    }
    
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
