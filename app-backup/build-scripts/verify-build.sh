#!/bin/bash

# Build Verification Script
# This script verifies that all components of the build are working correctly

set -e

echo "🔍 Verifying DotDashDash build environment..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check Node.js
print_check "Node.js version"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_pass "Node.js $NODE_VERSION"
else
    print_fail "Node.js not found"
    exit 1
fi

# Check npm
print_check "npm version"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_pass "npm $NPM_VERSION"
else
    print_fail "npm not found"
    exit 1
fi

# Check Rust
print_check "Rust version"
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    print_pass "$RUST_VERSION"
else
    print_fail "Rust not found"
    exit 1
fi

# Check Cargo
print_check "Cargo version"
if command -v cargo &> /dev/null; then
    CARGO_VERSION=$(cargo --version)
    print_pass "$CARGO_VERSION"
else
    print_fail "Cargo not found"
    exit 1
fi

# Check Tauri CLI
print_check "Tauri CLI"
if command -v cargo-tauri &> /dev/null; then
    print_pass "Tauri CLI installed"
else
    print_warn "Tauri CLI not found - installing..."
    cargo install tauri-cli
    print_pass "Tauri CLI installed"
fi

# Check Xcode Command Line Tools
print_check "Xcode Command Line Tools"
if xcode-select -p &> /dev/null; then
    XCODE_PATH=$(xcode-select -p)
    print_pass "Xcode tools at $XCODE_PATH"
else
    print_fail "Xcode Command Line Tools not found"
    exit 1
fi

# Navigate to app directory
if [ ! -d "app" ]; then
    print_fail "App directory not found. Run this script from the project root."
    exit 1
fi

cd app

# Check package.json
print_check "package.json"
if [ -f "package.json" ]; then
    print_pass "package.json found"
else
    print_fail "package.json not found"
    exit 1
fi

# Check node_modules
print_check "Node dependencies"
if [ -d "node_modules" ]; then
    print_pass "node_modules directory exists"
else
    print_warn "node_modules not found - installing dependencies..."
    npm install
    print_pass "Dependencies installed"
fi

# Check Tauri configuration
print_check "Tauri configuration"
if [ -f "src-tauri/tauri.conf.json" ]; then
    print_pass "tauri.conf.json found"
else
    print_fail "tauri.conf.json not found"
    exit 1
fi

# Check Cargo.toml
print_check "Rust configuration"
if [ -f "src-tauri/Cargo.toml" ]; then
    print_pass "Cargo.toml found"
else
    print_fail "Cargo.toml not found"
    exit 1
fi

# Test Rust compilation
print_check "Rust compilation"
cd src-tauri
if cargo check --quiet; then
    print_pass "Rust code compiles successfully"
else
    print_fail "Rust compilation failed"
    exit 1
fi
cd ..

# Test TypeScript compilation
print_check "TypeScript compilation"
if npm run build > /dev/null 2>&1; then
    print_pass "Frontend builds successfully"
else
    print_fail "Frontend build failed"
    exit 1
fi

# Test unit tests
print_check "Unit tests"
if npm test -- --run > /dev/null 2>&1; then
    print_pass "All tests pass"
else
    print_warn "Some tests failed - check with 'npm test'"
fi

echo ""
print_pass "🎉 Build environment verification complete!"
echo ""
echo "Your build environment is ready. You can now:"
echo "  • Run 'npm run tauri dev' for development"
echo "  • Run 'npm run tauri build' for production build"
echo "  • Run 'npm test' to run tests"
echo ""