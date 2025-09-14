#!/usr/bin/env bash
set -euo pipefail

# Notarize the DMG using a stored notarytool profile
# Usage: NOTARY_PROFILE="Profile Name" ./build-scripts/notarize-mac.sh

PROFILE="${NOTARY_PROFILE:-DotDash Notary}"

ART_DIR="src-tauri/target/release/bundle/macos"
DMG_PATH="${ART_DIR}/DotDash.dmg"

if [ ! -f "$DMG_PATH" ]; then
  echo "DMG not found at ${DMG_PATH}. Run: npm run build:mac" >&2
  exit 1
fi

echo "Submitting ${DMG_PATH} to Apple Notary using profile '${PROFILE}'..."
xcrun notarytool submit "$DMG_PATH" --keychain-profile "$PROFILE" --wait

echo "Notarization complete."


