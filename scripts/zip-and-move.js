#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const archiver = require('archiver');
const glob = require('glob');

// Get version information
const { getVersion } = require('./getVersion');
const versionInfo = getVersion();
const version = versionInfo.versionUnderscore;

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('os', {
    alias: 'o',
    type: 'string',
    description: 'Operating system (macos, win)',
    default: 'macos'
  })
  .option('arch', {
    alias: 'a',
    type: 'string',
    description: 'Architecture (x64, arm64)',
    default: 'x64'
  })
  .option('extension', {
    alias: 'e',
    type: 'string',
    description: 'File extension (app, pkg, exe)',
    default: 'app'
  })
  .help()
  .argv;

// Generate file path based on OS, architecture and extension
function getFileToZip(os, arch, extension) {
  const fileName = `kensington-konnect-diagnostics-${version}-${os}-${arch}.${extension}`;
  const filePath = `dist/${fileName}`;
  
  if (require('fs').existsSync(filePath)) {
    return filePath;
  }
  return null;
}

// Get files to zip
const files = [];
if (argv.os && argv.arch && argv.extension) {
  // Specific OS, arch and extension
  const file = getFileToZip(argv.os, argv.arch, argv.extension);
  if (file) files.push(file);
} else if (argv.os && argv.arch) {
  // Try common extensions for the given OS and arch
  const extensions = argv.os === 'win' ? ['exe'] : ['app', 'pkg'];
  for (const ext of extensions) {
    const file = getFileToZip(argv.os, argv.arch, ext);
    if (file) files.push(file);
  }
} else {
  // Fallback: find all files
  files.push(...glob.sync('dist/kensington-konnect-diagnostics-*', { nodir: true }).filter(file => !file.endsWith('.zip')));
}

const SIGNED_DIR = path.resolve(process.cwd(), 'signed_packages');

async function zipFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', err => reject(err));

    archive.pipe(output);
    
    // Check if it's a directory (like .app bundle) or a file
    if (fs.statSync(inputPath).isDirectory()) {
      archive.directory(inputPath, path.basename(inputPath));
    } else {
      archive.file(inputPath, { name: path.basename(inputPath) });
    }
    
    archive.finalize();
  });
}

async function main() {
  try {
    // Ensure SIGNED directory exists
    await fs.ensureDir(SIGNED_DIR);

    if (!files.length) {
      console.error('No files found to zip.');
      process.exit(1);
    }

    for (const file of files) {
      if (!fs.existsSync(file)) {
        console.warn(`File does not exist, skipping: ${file}`);
        continue;
      }
      const base = path.basename(file);
      // Use the filename as-is since it already contains version
      const zipName = `${base}.zip`;
      const zipPath = path.join(SIGNED_DIR, zipName);
      console.log(`\uD83D\uDD27 Zipping ${file} -> ${zipPath}`);
      await zipFile(file, zipPath);
      console.log(`\u2705 Zipped and moved: ${zipPath}`);
    }
    console.log(`\uD83D\uDCC1 All done! Zipped files are in: ${SIGNED_DIR}`);
  } catch (err) {
    console.error('\u274C Error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { zipFile, SIGNED_DIR }; 