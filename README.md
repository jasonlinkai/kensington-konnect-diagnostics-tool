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
- 🍎 **macOS App Bundle**: Native .app format for macOS applications
- 🔐 **Code Signing & Notarization**: Automated signing and notarization workflows

## Quick Start

### Install Dependencies
```bash
npm install
```

### Development Mode
```bash
npm run dev
```

### Build
```bash
# Build all formats (CLI + Libraries)
npm run build

# Build CLI tool only
npm run build:cli

# Build libraries only (CJS + ESM)
npm run build:libs
```

### Run Built Version(cli)
```bash
npm run start
```

## Release
#### macOS 
```bash
# Build .pkg
npm run package-mac-x64
npm run package-mac-arm64
npm run package-mac:all

# Build .app
npm run package-mac-app-x64
npm run package-mac-app-arm64
npm run package-mac-app:all
```

### win
```bash
# Build .exe
npm run package-win-x64
npm run package-win:all
```

## Installation

```bash
npm install kensington-konnect-diagnostics-cli-tool
```

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

### CLI Tool
After building, the `dist/` directory will contain:
- `index.js` - Executable CLI tool

### Executable Packages
After packaging, the `signed_packages/` directory will contain:

#### CLI Executables
- `kensington-konnect-diagnostics-{version}-win-x64.exe` - Windows x64
- `kensington-konnect-diagnostics-{version}-macos-x64` - macOS x64
- `kensington-konnect-diagnostics-{version}-macos-arm64` - macOS ARM64

#### macOS App Bundles
- `kensington-konnect-diagnostics-{version}-macos-x64.app` - macOS x64 App Bundle
- `kensington-konnect-diagnostics-{version}-macos-arm64.app` - macOS ARM64 App Bundle

#### macOS Installer Packages
- `kensington-konnect-diagnostics-{version}-macos-x64.pkg` - macOS x64 Installer
- `kensington-konnect-diagnostics-{version}-macos-arm64.pkg` - macOS ARM64 Installer

Where `{version}` is the version from package.json (e.g., 1_0_5 for version 1.0.5)

### Library Files
After building libraries, the `libs/` directory will contain:
- `index.cjs` - CommonJS format
- `index.esm.js` - ES Modules format

### Generated Reports

The tool generates diagnostic reports in different locations depending on how it's used:

#### As CLI Tool
- **Output Location**: System Documents folder
- **File Format**: `kensington-konnect-diagnostics-{version}-{timestamp}.zip`
- **Example**: `~/Documents/kensington-konnect-diagnostics-1.0.5-2025-09-25T13-30-45.zip`

#### As Node.js Library
- **Default Location**: System Documents folder (same as CLI)
- **Custom Location**: Use `zipOutputPath` option to specify custom output path
- **Example**:
  ```javascript
  const result = await runDiagnostics({
    zipOutputPath: '/path/to/custom/output/diagnostics.zip'
  });
  ```

#### As Executable File
- **Output Location**: Next to the executable file
- **File Format**: `kensington-konnect-diagnostics-{version}-{timestamp}.zip`
- **Example**: If executable is in `/Applications/`, report will be in `/Applications/`

### macOS Distribution Notes

#### CLI Executables
- **CLI binary** (e.g., `kensington-konnect-diagnostics-1.0.5-macos-x64`, `kensington-konnect-diagnostics-1.0.5-macos-arm64`) requires code signing and notarization, but does not require stapling.

#### App Bundles (.app)
- **App bundles** require both code signing and notarization and stapling for distribution

#### Installer Packages (.pkg)
- **PKG installers** require code signing, notarization, and stapling


## Project Structure

```
logtool/
├── src/                    # TypeScript source code
│   ├── collectors/         # Data collection modules
│   ├── utils/             # Utility functions
│   └── index.ts           # Main entry point
├── scripts/               # Build scripts
│   ├── build-cli.js       # CLI build configuration
│   ├── build-libs.js      # Library build configuration
│   ├── build-pkg.js       # Package build configuration
│   ├── create-app.js      # macOS app bundle creation
│   ├── create-pkg.js      # macOS installer creation
│   ├── sign-macos.js      # macOS code signing
│   ├── notarize-macos.js  # macOS notarization
│   └── zip-and-move.js    # Package compression and organization
├── resources/             # App resources
│   ├── appIcon.icns       # macOS app icon
│   ├── appIcon.ico        # Windows app icon
│   └── appIcon.png        # Generic app icon
├── dist/                  # CLI tool output
│   └── index.js          # Executable CLI tool
├── libs/                  # Library files output
│   ├── index.cjs         # CommonJS format
│   ├── index.esm.js      # ES Modules format
│   └── index.d.ts        # TypeScript declarations
└── signed_packages/       # Final executable packages
    ├── *.exe              # Windows executables
    ├── *.app              # macOS app bundles
    └── *.pkg              # macOS installer packages
```

## Technical Architecture

- **Language**: TypeScript
- **Runtime**: Node.js >= 14.0.0
- **Build Tool**: esbuild
- **Packaging Tool**: pkg
- **Module Formats**: CommonJS, ES Modules
- **macOS Features**: Code signing, notarization, app bundles
- **Main Dependencies**:
  - `systeminformation` - System information collection
  - `usb` (node-usb) - USB device detection
  - `node-hid` - HID device detection
  - `archiver` - ZIP file compression
  - `yargs` - CLI argument parsing
  - `dotenv` - Environment variable management

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


## Author

**JackyLin** - loveguitar668@gmail.com