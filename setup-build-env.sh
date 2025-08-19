#!/bin/bash

# Build Environment Setup for DotDashDash Tauri App
# This script sets up the complete build environment for the project

set -e  # Exit on any error

echo "🚀 Setting up build environment for DotDashDash..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS. Please adapt for your platform."
    exit 1
fi

print_status "Checking system requirements..."

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    print_warning "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    print_success "Homebrew is installed"
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Installing Node.js..."
    brew install node
else
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    print_error "npm not found. Please install Node.js properly."
    exit 1
else
    NPM_VERSION=$(npm --version)
    print_success "npm is installed: $NPM_VERSION"
fi

# Check for Rust
if ! command -v rustc &> /dev/null; then
    print_warning "Rust not found. Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
else
    RUST_VERSION=$(rustc --version)
    print_success "Rust is installed: $RUST_VERSION"
fi

# Check for Cargo
if ! command -v cargo &> /dev/null; then
    print_error "Cargo not found. Please install Rust properly."
    exit 1
else
    CARGO_VERSION=$(cargo --version)
    print_success "Cargo is installed: $CARGO_VERSION"
fi

# Install system dependencies for Tauri
print_status "Installing system dependencies..."
brew install --quiet webkit2gtk || true

# Navigate to app directory


print_status "Installing Node.js dependencies..."
npm install

print_status "Installing Tauri CLI via Cargo..."
cargo install tauri-cli

print_status "Verifying Tauri installation..."
if command -v cargo-tauri &> /dev/null; then
    TAURI_VERSION=$(cargo tauri --version)
    print_success "Tauri CLI is installed: $TAURI_VERSION"
else
    print_error "Tauri CLI installation failed"
    exit 1
fi

print_status "Building Rust dependencies..."
cd src-tauri
cargo fetch
cargo check


print_status "Running initial build test..."
npm run build

print_success "Build environment setup complete!"
echo ""
echo "🎉 Your build environment is ready!"
echo ""
echo "Available commands:"
echo "  npm run dev          - Start development server"
echo "  npm run build        - Build for production"
echo "  npm run test         - Run tests"
echo "  npm run test:ui      - Run tests with UI"
echo "  npm run tauri dev    - Start Tauri development mode"
echo "  npm run tauri build  - Build Tauri application"
echo ""
echo "To get started:"
echo "  "
echo "  npm run dev"