#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const glob = require('glob');

// Read version from package.json
const packageJson = require('../package.json');
const version = packageJson.version;

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('app', {
    alias: 'a',
    type: 'array',
    description: 'Path(s) to the signed application(s) to be zipped',
    default: glob.sync('dist/kensington-konnect-diagnostics-*', { nodir: true }).filter(file => !file.endsWith('.zip'))
  })
  .help()
  .argv;

const SIGNED_DIR = path.resolve(process.cwd(), 'signed_packages');

async function zipFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', err => reject(err));

    archive.pipe(output);
    archive.file(inputPath, { name: path.basename(inputPath) });
    archive.finalize();
  });
}

async function main() {
  try {
    // Ensure SIGNED directory exists
    await fs.ensureDir(SIGNED_DIR);

    const files = argv.app;
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