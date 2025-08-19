# DotDashDash

A modern, native macOS text expansion application built with Tauri, React, and TypeScript.

## Features

- **🚀 Fast Text Expansion** - Instant text replacement with customizable shortcuts
- **🎯 Smart Conflict Resolution** - Intelligent duplicate handling with multiple resolution strategies
- **⏸️ Global Pause Toggle** - Pause/resume expansions system-wide with tray integration
- **🔧 System Tray Integration** - Native macOS menu bar app with full tray controls
- **🛡️ Security First** - Automatic secure input detection and permission management
- **📊 Comprehensive Diagnostics** - Real-time system monitoring and troubleshooting tools
- **💾 Local Data** - All data stored locally with JSON import/export
- **🎨 Modern UI** - Clean, responsive interface built with Tailwind CSS and shadcn/ui

## Quick Start

### Prerequisites

- macOS (required for text expansion functionality)

### Development

For regular development:
```bash
npm run dev
```

For styling work in the browser (skips onboarding and Tauri API calls):
```bash
npm run dev:style
```

The styling dev mode:
- Skips accessibility permission requirements
- Mocks all Tauri API calls
- Goes directly to the main app interface
- Perfect for working on UI/UX without native dependencies
- Node.js 18+ and npm
- Rust and Cargo
- Xcode Command Line Tools

### One-Command Setup

```bash
./setup-build-env.sh
```

This script will automatically install all dependencies and verify your build environment.

### Development

```bash
# Start development server with hot reload
npm run tauri dev

# Run tests
npm test

# Verify build environment
./build-scripts/verify-build.sh
```

### Production Build

```bash
# Build for production
npm run tauri build

# Clean build artifacts
./build-scripts/clean-build.sh
```

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui components
- **Backend**: Rust + Tauri with native macOS APIs (CGEventTap, Accessibility)
- **Data Storage**: Local JSON with versioned persistence
- **Build System**: Vite + Tauri CLI with custom verification scripts

## Key Components

### Text Expansion Engine
- Native keystroke monitoring via CGEventTap
- Delimiter-based triggering (space, tab, enter)
- Injection guard to prevent recursive expansions
- Dry-run mode for testing

### Duplicate Handling System
- Smart conflict detection algorithms
- Multiple resolution strategies:
  - **Skip**: Keep existing, ignore new
  - **Replace**: Overwrite existing with new
  - **Rename**: Auto-rename conflicting shortcuts
- Interactive resolution dialog with conflict analysis

### Global Pause Toggle
- User-initiated pause/resume functionality
- Automatic pause on secure input detection
- Multiple pause reasons support
- Tray integration for quick access

### System Tray Integration
- Native macOS tray icon with context menu
- Dynamic icon states (Active/Paused/Warning/Error)
- Quick access to all major functions
- Menu bar app experience

## Permissions

DotDashDash requires the following macOS permissions:

- **Accessibility**: Required for keystroke monitoring and text injection
- **Input Monitoring**: Required for global keystroke capture

The app will guide you through the permission setup process on first launch.

## Build Environment

The project includes a complete build environment with:

- **Automated Setup**: `./setup-build-env.sh` installs all dependencies
- **Build Verification**: `./build-scripts/verify-build.sh` checks your environment
- **Clean Builds**: `./build-scripts/clean-build.sh` removes all artifacts
- **Development Tools**: Hot reload, testing, and debugging support

### Build Outputs

- **Development**: App runs with hot reload and live debugging
- **Production**: `src-tauri/target/release/bundle/macos/DotDashDash.app`
- **Frontend**: `dist/` (for web deployment if needed)

## Development

### Project Structure

```
DotDashDash/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── views/             # Main application views
│   ├── state/             # State management
│   └── lib/               # Utilities and helpers
├── src-tauri/             # Rust backend
│   ├── src/               # Rust source code
│   └── icons/             # App and tray icons
├── build-scripts/         # Build and verification tools
└── .kiro/specs/          # Feature specifications
```

### Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run specific test file
npm test -- conflict-utils.test.ts
```

### Debugging

The app includes comprehensive logging:

- **Console Logs**: Available in macOS Console.app
- **In-App Diagnostics**: Real-time log viewer in the Diagnostics tab
- **Build Verification**: Automated environment checking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Verify build: `./build-scripts/verify-build.sh`
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [Kiro IDE](https://kiro.ai) for AI-assisted development
