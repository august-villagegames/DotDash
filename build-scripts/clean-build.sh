#!/bin/bash

# Clean Build Script
# This script cleans all build artifacts and caches

echo "🧹 Cleaning DotDashDash build artifacts..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[CLEAN]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[DONE]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
}

# Clean frontend build artifacts
print_status "Cleaning frontend build artifacts..."
if [ -d "dist" ]; then
    rm -rf dist
    print_success "Removed dist/"
else
    print_warning "dist/ not found"
fi

# Clean node_modules (optional - uncomment if needed)
# print_status "Cleaning node_modules..."
# if [ -d "node_modules" ]; then
#     rm -rf node_modules
#     print_success "Removed node_modules/"
# else
#     print_warning "node_modules/ not found"
# fi

# Clean Rust build artifacts
print_status "Cleaning Rust build artifacts..."
if [ -d "src-tauri/target" ]; then
    cd src-tauri
    cargo clean
    cd ..
    print_success "Cleaned Rust target/"
else
    print_warning "src-tauri/target/ not found"
fi

# Clean test artifacts
print_status "Cleaning test artifacts..."
if [ -d "coverage" ]; then
    rm -rf coverage
    print_success "Removed coverage/"
else
    print_warning "coverage/ not found"
fi

# Clean temporary files
print_status "Cleaning temporary files..."
find . -name ".DS_Store" -delete 2>/dev/null || true
find . -name "*.log" -delete 2>/dev/null || true
find . -name "*.tmp" -delete 2>/dev/null || true
print_success "Removed temporary files"

# Clean npm cache (optional)
print_status "Cleaning npm cache..."
npm cache clean --force > /dev/null 2>&1
print_success "Cleaned npm cache"

echo ""
print_success "🎉 Clean complete!"
echo ""
echo "To rebuild:"
echo "  1. Run 'npm install' to reinstall dependencies"
echo "  2. Run 'npm run build' to rebuild frontend"
echo "  3. Run 'npm run tauri build' to rebuild the full app"
echo ""