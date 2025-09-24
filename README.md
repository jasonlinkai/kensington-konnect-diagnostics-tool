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
npm install kensington-konnect-diagnostics-tool
```

### Native Dependencies (Optional)

For full functionality including USB and HID device detection, you need to install native dependencies separately:

```bash
# Basic installation (works without native modules)
npm install kensington-konnect-diagnostics-tool

# Install native dependencies for full functionality
npm install node-hid usb-detection

# Or install everything at once
npm install kensington-konnect-diagnostics-tool node-hid usb-detection
```

**Important Notes**: 
- Native dependencies (`node-hid`, `usb-detection`) are **peer dependencies**
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

If you encounter compilation errors, please refer to the [node-hid](https://github.com/node-hid/node-hid) and [usb-detection](https://github.com/MadLittleMods/node-usb-detection) documentation for detailed installation instructions.

## Usage

### As CLI Tool
```bash
# Direct execution
node dist/index.js

# Or install globally
npm install -g kensington-konnect-diagnostics-tool
kensington-konnect-diagnostics
```

### As Node.js Library

#### CommonJS
```javascript
const { runDiagnostics } = require('kensington-konnect-diagnostics-tool');

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
import { runDiagnostics } from 'kensington-konnect-diagnostics-tool';

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
  - `usb-detection` - USB device detection
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
