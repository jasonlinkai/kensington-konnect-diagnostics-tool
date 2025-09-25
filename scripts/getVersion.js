#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Get version information from package.json
 * @returns {Object} Version information object
 */
function getVersion() {
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const version = packageJson.version;
    const versionUnderscore = version.split('.').join('_');
    const versionHyphen = version.split('.').join('-');
    
    return {
      version,           // 1.0.4
      versionUnderscore, // 1_0_4
      versionHyphen,    // 1-0-4
      packageJson       // Full package.json object
    };
  } catch (error) {
    console.error('❌ Failed to read package.json:', error.message);
    process.exit(1);
  }
}

/**
 * Get version string in different formats
 * @param {string} format - Format type: 'normal', 'underscore', 'hyphen'
 * @returns {string} Formatted version string
 */
function getVersionString(format = 'normal') {
  const versionInfo = getVersion();
  
  switch (format) {
    case 'underscore':
      return versionInfo.versionUnderscore;
    case 'hyphen':
      return versionInfo.versionHyphen;
    case 'normal':
    default:
      return versionInfo.version;
  }
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const format = args[0] || 'normal';
  
  console.log(getVersionString(format));
}

if (require.main === module) {
  main();
}

module.exports = { getVersion, getVersionString };
