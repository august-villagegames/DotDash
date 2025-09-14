#!/usr/bin/env bash
set -euo pipefail

ART_DIR="src-tauri/target/release/bundle/macos"
APP_PATH="${ART_DIR}/DotDash.app"
DMG_PATH="${ART_DIR}/DotDash.dmg"

if [ ! -f "$DMG_PATH" ]; then
  echo "DMG not found at ${DMG_PATH}. Run: npm run build:mac" >&2
  exit 1
fi

echo "Stapling ticket to DMG..."
xcrun stapler staple "$DMG_PATH"

if [ -d "$APP_PATH" ]; then
  echo "Stapling ticket to .app bundle..."
  xcrun stapler staple "$APP_PATH"
fi

echo "Stapling complete."


