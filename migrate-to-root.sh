#!/bin/bash

# Migration Script: Move app contents to project root
# This flattens the structure to follow Tauri conventions

set -e

echo "🔄 Migrating app structure to project root..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[MIGRATE]${NC} $1"
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

# Check if app directory exists
if [ ! -d "app" ]; then
    print_error "App directory not found. Nothing to migrate."
    exit 1
fi

# Create backup
print_status "Creating backup..."
cp -r app app-backup
print_success "Backup created at app-backup/"

# Move contents from app/ to root
print_status "Moving app contents to root..."

# Move all files and directories from app/ to root, except those that already exist
cd app
for item in *; do
    if [ "$item" != "." ] && [ "$item" != ".." ]; then
        if [ -e "../$item" ]; then
            print_warning "Skipping $item (already exists at root)"
        else
            mv "$item" "../$item"
            print_success "Moved $item to root"
        fi
    fi
done

# Move hidden files
for item in .*; do
    if [ "$item" != "." ] && [ "$item" != ".." ]; then
        if [ -e "../$item" ]; then
            print_warning "Skipping $item (already exists at root)"
        else
            mv "$item" "../$item"
            print_success "Moved $item to root"
        fi
    fi
done

cd ..

# Update build scripts paths
print_status "Updating build script paths..."

# Update verify-build.sh
if [ -f "build-scripts/verify-build.sh" ]; then
    sed -i '' 's/if \[ ! -d "app" \]; then/if [ ! -f "package.json" ]; then/' build-scripts/verify-build.sh
    sed -i '' 's/print_fail "App directory not found. Run this script from the project root."/print_fail "package.json not found. Run this script from the project root."/' build-scripts/verify-build.sh
    sed -i '' 's/cd app//g' build-scripts/verify-build.sh
    print_success "Updated verify-build.sh"
fi

# Update setup-build-env.sh
if [ -f "setup-build-env.sh" ]; then
    sed -i '' 's/cd app//g' setup-build-env.sh
    sed -i '' 's/cd \.\.//' setup-build-env.sh
    print_success "Updated setup-build-env.sh"
fi

# Update documentation
print_status "Updating documentation..."

# Update QUICK_START.md
if [ -f "QUICK_START.md" ]; then
    sed -i '' 's/cd app && //g' QUICK_START.md
    sed -i '' 's/\.\/app\/build-scripts\//\.\/build-scripts\//g' QUICK_START.md
    print_success "Updated QUICK_START.md"
fi

# Update BUILD_SETUP.md
if [ -f "BUILD_SETUP.md" ]; then
    sed -i '' 's/cd app//g' BUILD_SETUP.md
    sed -i '' 's/cd app\/src-tauri/cd src-tauri/g' BUILD_SETUP.md
    print_success "Updated BUILD_SETUP.md"
fi

# Remove empty app directory
if [ -d "app" ] && [ -z "$(ls -A app)" ]; then
    rmdir app
    print_success "Removed empty app directory"
fi

# Update .gitignore if it exists
if [ -f ".gitignore" ]; then
    # Remove app/ entries since everything is now at root
    sed -i '' '/^app\//d' .gitignore
    print_success "Updated .gitignore"
fi

echo ""
print_success "🎉 Migration complete!"
echo ""
echo "New structure:"
echo "  ├── src/           (frontend)"
echo "  ├── src-tauri/     (backend)"
echo "  ├── package.json"
echo "  ├── build-scripts/"
echo "  └── ..."
echo ""
echo "Updated commands (no more 'cd app'):"
echo "  npm run tauri dev    - Start development"
echo "  npm run tauri build  - Build for production"
echo "  npm run build        - Build frontend only"
echo "  npm test             - Run tests"
echo ""
echo "If everything works, you can remove the backup:"
echo "  rm -rf app-backup"
echo ""