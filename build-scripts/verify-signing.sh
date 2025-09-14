#!/usr/bin/env bash
set -euo pipefail

ART_DIR="src-tauri/target/release/bundle/macos"
APP_PATH="${ART_DIR}/DotDash.app"
DMG_PATH="${ART_DIR}/DotDash.dmg"

if [ ! -d "$APP_PATH" ]; then
  echo "App not found at ${APP_PATH}. Run: npm run build:mac" >&2
  exit 1
fi

echo "Codesign verification (.app)..."
codesign --verify --deep --strict --verbose=2 "$APP_PATH"

echo "Gatekeeper assessment (.app)..."
spctl -a -vvv "$APP_PATH" || true

if [ -f "$DMG_PATH" ]; then
  echo "Gatekeeper assessment (DMG)..."
  spctl -a -vvv "$DMG_PATH" || true
fi

echo "Verification complete."


