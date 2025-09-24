# Kensington Konnect Diagnostics Tool

A cross-platform CLI tool and Node.js library for collecting system information, application logs, crash reports, and USB device information. Supports both standalone CLI usage and programmatic integration.

## Features

- 🔍 **System Information Collection**: OS, version, CPU architecture, memory, etc.
- 📝 **Application Logs**: Chrome, VSCode, Slack, and other common applications
- 💥 **Crash Reports**: Automatically collect the latest crash reports (top 3)
- 🔌 **USB Devices**: Detailed information of connected devices
- 📱 **Bluetooth Devices**: Bluetooth device detection and information
- 🖱️ **Input Devices**: Mouse and keyboard device information
- 📦 **Auto Packaging**: Generate a ZIP file containing all information
- 🖥️ **Cross-platform Support**: Windows x64, macOS x64/ARM64
- 📚 **Dual Usage**: CLI tool + Node.js library
- 📦 **Multiple Module Formats**: CommonJS, ES Modules

## Quick Start

### Install Dependencies
```bash
npm install
```

### Development Mode
```bash
npm run dev
```

### Build Options
```bash
# Build all formats (CLI + Libraries)
npm run build

# Build CLI tool only
npm run build:cli

# Build libraries only (CJS + ESM)
npm run build:libs
```

### Run Built Version
```bash
npm run start
```

## Installation

```bash
npm install kensington-konnect-diagnostics-cli-tool
```

### Native Dependencies (Optional)

For full functionality including USB and HID device detection, you need to install native dependencies separately:

```bash
# Basic installation (works without native modules)
npm install kensington-konnect-diagnostics-cli-tool

# Install native dependencies for full functionality
npm install node-hid usb

# Or install everything at once
npm install kensington-konnect-diagnostics-cli-tool node-hid usb
```

**Important Notes**: 
- Native dependencies (`node-hid`, `usb`) are **peer dependencies**
- You need to install them separately for full functionality
- The tool will work without them but with limited device detection capabilities
- If native modules are not available, you'll see warnings but the tool will continue to work
- USB and HID device detection will be skipped if native modules are missing

### Native Dependencies Installation Requirements

Some native dependencies may require additional system dependencies:

**Windows:**
- Visual Studio Build Tools
- Python 2.7 or 3.x

**macOS:**
- Xcode Command Line Tools
- Python 2.7 or 3.x

**Linux:**
- build-essential
- Python 2.7 or 3.x
- libudev-dev (for USB devices)

If you encounter compilation errors, please refer to the [node-hid](https://github.com/node-hid/node-hid) and [node-usb](https://github.com/node-usb/node-usb) documentation for detailed installation instructions.

## Usage

### As CLI Tool
```bash
# Direct execution
node dist/index.js

# Or install globally
npm install -g kensington-konnect-diagnostics-cli-tool
kensington-konnect-diagnostics
```

### As Node.js Library

#### CommonJS
```javascript
const { runDiagnostics } = require('kensington-konnect-diagnostics-cli-tool');

async function example() {
  const result = await runDiagnostics({
    includeLogs: true,
    createZip: true
  });
  
  if (result.success) {
    console.log('Diagnostics completed:', result.outputPath);
  }
}
```

#### ES Modules
```javascript
import { runDiagnostics } from 'kensington-konnect-diagnostics-cli-tool';

const result = await runDiagnostics();
```


## Build Executable Files

### macOS Version
```bash
# Build CLI tool and create packages
npm run package-mac-x64
npm run package-mac-arm64
npm run package-mac:all
```

### Windows Version
```bash
# Build CLI tool and create packages
npm run package-win-x64
npm run package-win:all
```

## Output Files

### CLI Tool
After building, the `dist/` directory will contain:
- `index.js` - Executable CLI tool

### Executable Packages
After packaging, the `signed_packages/` directory will contain:
- `kensington-konnect-diagnostics-{version}-win-x64.exe` - Windows x64
- `kensington-konnect-diagnostics-{version}-macos-x64` - macOS x64
- `kensington-konnect-diagnostics-{version}-macos-arm64` - macOS ARM64

Where `{version}` is the version from package.json (e.g., 1_0_0 for version 1.0.0)

### Library Files
After building libraries, the `libs/` directory will contain:
- `index.cjs` - CommonJS format
- `index.esm.js` - ES Modules format

### Generated Reports
After running the tool, a `kensington-konnect-diagnostics-{version}-{timestamp}.zip` file will be generated in the Documents folder.

### macOS CLI Tool
- **CLI binary (such as kensington-konnect-diagnostics-1.0.0-macos-x64, kensington-konnect-diagnostics-1.0.0-macos-arm64)** only needs to be signed (codesign), notarization is not required to run on other computers.
- Notarization only applies to .app/.pkg/.dmg, CLI binary can be distributed directly.


## Project Structure

```
logtool/
├── src/                    # TypeScript source code
│   ├── collectors/         # Data collection modules
│   ├── utils/             # Utility functions
│   └── index.ts           # Main entry point
├── scripts/               # Build scripts
│   ├── build-cli.js       # CLI build configuration
│   └── build-libs.js      # Library build configuration
├── dist/                  # CLI tool output
│   └── index.js          # Executable CLI tool
├── libs/                  # Library files output
│   ├── index.cjs         # CommonJS format
│   ├── index.esm.js      # ES Modules format
└── signed_packages/       # Final executable packages
```

## Technical Architecture

- **Language**: TypeScript
- **Runtime**: Node.js >= 14.0.0
- **Build Tool**: esbuild
- **Packaging Tool**: pkg
- **Module Formats**: CommonJS, ES Modules
- **Main Dependencies**:
  - `systeminformation` - System information collection
  - `usb` (node-usb) - USB device detection
  - `node-hid` - HID device detection
  - `archiver` - ZIP file compression
  - `yargs` - CLI argument parsing

## API Reference

### Main Function
```typescript
runDiagnostics(options?: DiagnosticsOptions): Promise<DiagnosticsResult>
```

### Individual Collectors
```typescript
collectSystemInfoData(): Promise<SystemInfo>
collectUsbDevicesData(): Promise<UsbDevice[]>
collectInputDevicesData(): Promise<InputDevice[]>
collectBluetoothDevicesData(): Promise<BluetoothDevice[]>
```

### Options
```typescript
interface DiagnosticsOptions {
  outputDir?: string;
  includeLogs?: boolean;
  includeCrashReports?: boolean;
  includeUsbDevices?: boolean;
  includeInputDevices?: boolean;
  includeBluetoothDevices?: boolean;
  createZip?: boolean;
  zipOutputPath?: string;
}
```

## Release Management

### Prerequisites for Publishing
- npm account with publish permissions
- Git repository with clean working directory
- All tests passing

### Publishing to npm

#### Quick Publish
```bash
# Build and publish to npm
npm run publish:npm
```

#### Version-based Publishing
```bash
# Patch version (1.0.1 → 1.0.2) - Bug fixes
npm run publish:patch

# Minor version (1.0.1 → 1.1.0) - New features
npm run publish:minor

# Major version (1.0.1 → 2.0.0) - Breaking changes
npm run publish:major
```

#### Pre-release Versions
```bash
# Beta version (1.0.1 → 1.0.2-beta.0)
npm run publish:beta

# Alpha version (1.0.1 → 1.0.2-alpha.0)
npm run publish:alpha
```

### Release Process

1. **Prepare for Release**
   ```bash
   # Ensure all changes are committed
   git status
   
   # Run tests (if available)
   npm test
   
   # Build the project
   npm run build
   ```

2. **Choose Release Type**
   - **Patch**: Bug fixes, small improvements
   - **Minor**: New features, backward compatible
   - **Major**: Breaking changes, major updates
   - **Pre-release**: Beta/Alpha for testing

3. **Execute Release**
   ```bash
   # Example: Release a minor version
   npm run publish:minor
   ```

4. **Verify Release**
   ```bash
   # Check npm registry
   npm view kensington-konnect-diagnostics-cli-tool version
   
   # Test installation
   npm install kensington-konnect-diagnostics-cli-tool@latest
   ```

### Release Scripts Explained

| Script | Description | Version Change | Use Case |
|--------|-------------|---------------|----------|
| `publish:npm` | Build and publish current version | None | Manual publish |
| `publish:patch` | Auto-increment patch + publish | 1.0.1 → 1.0.2 | Bug fixes |
| `publish:minor` | Auto-increment minor + publish | 1.0.1 → 1.1.0 | New features |
| `publish:major` | Auto-increment major + publish | 1.0.1 → 2.0.0 | Breaking changes |
| `publish:beta` | Create beta pre-release | 1.0.1 → 1.0.2-beta.0 | Testing |
| `publish:alpha` | Create alpha pre-release | 1.0.1 → 1.0.2-alpha.0 | Early testing |

### Pre-release Installation
```bash
# Install beta version
npm install kensington-konnect-diagnostics-cli-tool@beta

# Install alpha version
npm install kensington-konnect-diagnostics-cli-tool@alpha

# Install specific version
npm install kensington-konnect-diagnostics-cli-tool@1.0.2-beta.0
```

### Git Integration
All release scripts automatically:
- ✅ Update version in `package.json`
- ✅ Create Git tag with version number
- ✅ Commit version changes
- ✅ Build the project
- ✅ Publish to npm registry

### Rollback (if needed)
```bash
# Unpublish a version (within 24 hours)
npm unpublish kensington-konnect-diagnostics-cli-tool@1.0.2

# Revert Git tag
git tag -d v1.0.2
git push origin :refs/tags/v1.0.2
```

## Development

### Prerequisites
- Node.js >= 14.0.0
- npm or yarn

### Setup
```bash
git clone <repository-url>
cd logtool
npm install
```

### Development Commands
```bash
# Start development mode
npm run dev

# Build CLI tool only
npm run build:cli

# Build libraries only
npm run build:libs

# Build everything
npm run build

# Run built CLI tool
npm run start
```

### Testing
```bash
# Test CLI tool
node dist/index.js

# Test library imports
node -e "const { runDiagnostics } = require('./libs/index.cjs'); console.log('CJS import works');"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the build process
5. Submit a pull request

## Author

**JackyLin** - loveguitar668@gmail.com

## License

MIT License - see LICENSE file for details.
