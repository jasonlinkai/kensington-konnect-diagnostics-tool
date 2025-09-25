# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2025-09-25

### Added
- **New release type: .app format for macOS applications** ([6438537](https://github.com/jasonlinkai/kensington-konnect-diagnostics-cli-tool/commit/6438537))
  - Added macOS app bundle creation support
  - Implemented app signing and notarization workflows
  - Added app icon resources (icns, ico, png formats)
  - Created comprehensive build scripts for app distribution
  - Enhanced packaging system with app-specific configurations

### Changed
- **Version bump to 1.0.5** ([90ae079](https://github.com/jasonlinkai/kensington-konnect-diagnostics-cli-tool/commit/90ae079))
- Enhanced build system with improved CLI and library compilation
- Updated packaging scripts for better cross-platform support

### Technical Details
- **Files Modified**: 20 files changed, 790 insertions(+), 588 deletions(-)
- **New Scripts**: `create-app.js`, `notarize-macos.js`, `sign-macos.js`
- **Resources**: Added app icons in multiple formats
- **Build System**: Enhanced CLI and library build processes

## [1.0.4] - 2025-09-25

### Added
- **USB device detection and migration to usb library** ([1b8b580](https://github.com/jasonlinkai/kensington-konnect-diagnostics-cli-tool/commit/1b8b580))
  - Migrated from usb-detection to native usb library
  - Enhanced USB device enumeration capabilities
  - Improved device detection accuracy and performance
- **TypeScript declaration files for libraries** ([0b74766](https://github.com/jasonlinkai/kensington-konnect-diagnostics-cli-tool/commit/0b74766))
  - Added comprehensive TypeScript definitions
  - Enhanced developer experience with full type support
- **Test script for npm publish compatibility** ([282158f](https://github.com/jasonlinkai/kensington-konnect-diagnostics-cli-tool/commit/282158f))
  - Added test script to ensure npm publish compatibility
  - Improved package validation and quality assurance

### Changed
- **Package name changed to `kensington-konnect-diagnostics-cli-tool`** ([6f8f6e1](https://github.com/jasonlinkai/kensington-konnect-diagnostics-cli-tool/commit/6f8f6e1), [e711911](https://github.com/jasonlinkai/kensington-konnect-diagnostics-cli-tool/commit/e711911))
  - Renamed package for better identification and branding
  - Updated all references and documentation
- **Updated usb-detection to v4.14.2 to fix build errors** ([298da38](https://github.com/jasonlinkai/kensington-konnect-diagnostics-cli-tool/commit/298da38))
  - Resolved build compatibility issues
  - Improved dependency management
- **Made peerDependencies required instead of optional** ([5f6ecdd](https://github.com/jasonlinkai/kensington-konnect-diagnostics-cli-tool/commit/5f6ecdd))
  - Enhanced dependency management
  - Improved package reliability and consistency

### Fixed
- **Build errors related to usb-detection library** ([298da38](https://github.com/jasonlinkai/kensington-konnect-diagnostics-cli-tool/commit/298da38))
  - Resolved compilation issues
  - Fixed dependency conflicts

### Technical Details
- **USB Migration**: 6 files changed, 134 insertions(+), 97 deletions(-)
- **Package Updates**: Enhanced dependency management and build system
- **TypeScript Support**: Full type definitions for all modules

## [1.0.3] - 2025-09-25

### Changed
- **Made peerDependencies required instead of optional** ([40758ee](https://github.com/jasonlinkai/kensington-konnect-diagnostics-cli-tool/commit/40758ee))
  - Improved dependency management
  - Enhanced package reliability

## [1.0.2] - 2025-09-24

### Added
- **Initial npm package setup** ([df41f33](https://github.com/jasonlinkai/kensington-konnect-diagnostics-cli-tool/commit/df41f33))
  - Complete npm package configuration
  - Package.json with all necessary metadata
  - Build and distribution scripts
- **Basic CLI tool functionality** ([ec855bb](https://github.com/jasonlinkai/kensington-konnect-diagnostics-cli-tool/commit/ec855bb))
  - Command-line interface implementation
  - Cross-platform support (macOS, Windows)
  - Automated system information gathering
- **System information collection**
  - Hardware specifications
  - Operating system details
  - System performance metrics
- **USB device detection**
  - USB device enumeration
  - Device information collection
  - Vendor and product identification
- **Bluetooth device detection**
  - Bluetooth device scanning
  - Device pairing information
  - Connection status monitoring
- **Input device detection**
  - Keyboard and mouse detection
  - Input device capabilities
  - Device configuration information
- **Crash reports collection**
  - System crash log analysis
  - Application crash detection
  - Error reporting and logging
- **Log file collection and analysis**
  - System log gathering
  - Application log analysis
  - Log compression and archiving

---