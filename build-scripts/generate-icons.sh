#!/bin/bash

# Icon generation script for DotDash
# Requires ImageMagick and Inkscape for SVG to PNG conversion

set -e

ICONS_DIR="src-tauri/icons"
APP_ICON_SVG="$ICONS_DIR/app-icon.svg"
TRAY_ICON_SVG="$ICONS_DIR/tray-icon-template.svg"
TRAY_PAUSED_SVG="$ICONS_DIR/tray-icon-paused-template.svg"
TRAY_WARNING_SVG="$ICONS_DIR/tray-icon-warning-template.svg"

echo "🎨 Generating DotDash icons..."

# Check if required tools are available
command -v magick >/dev/null 2>&1 || { echo "❌ ImageMagick is required but not installed. Please install it first."; exit 1; }

# Function to convert SVG to PNG using ImageMagick
svg_to_png() {
    local input_svg="$1"
    local output_png="$2"
    local size="$3"
    
    echo "  📐 Converting $input_svg to $output_png ($size x $size)"
    magick -background transparent -size "${size}x${size}" "$input_svg" "$output_png"
}

# Generate app icons from SVG template
echo "🔸 Generating app icons..."
svg_to_png "$APP_ICON_SVG" "$ICONS_DIR/32x32.png" 32
svg_to_png "$APP_ICON_SVG" "$ICONS_DIR/128x128.png" 128
svg_to_png "$APP_ICON_SVG" "$ICONS_DIR/128x128@2x.png" 256
svg_to_png "$APP_ICON_SVG" "$ICONS_DIR/icon.png" 512

# Generate tray icons
echo "🔸 Generating tray icons..."
svg_to_png "$TRAY_ICON_SVG" "$ICONS_DIR/tray-icon.png" 32
svg_to_png "$TRAY_PAUSED_SVG" "$ICONS_DIR/tray-icon-paused.png" 32
svg_to_png "$TRAY_WARNING_SVG" "$ICONS_DIR/tray-icon-warning.png" 32

# Generate ICNS file for macOS (requires iconutil on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🔸 Generating ICNS file for macOS..."
    
    ICONSET_DIR="$ICONS_DIR/DotDash.iconset"
    mkdir -p "$ICONSET_DIR"
    
    # Generate required sizes for ICNS
    svg_to_png "$APP_ICON_SVG" "$ICONSET_DIR/icon_16x16.png" 16
    svg_to_png "$APP_ICON_SVG" "$ICONSET_DIR/icon_16x16@2x.png" 32
    svg_to_png "$APP_ICON_SVG" "$ICONSET_DIR/icon_32x32.png" 32
    svg_to_png "$APP_ICON_SVG" "$ICONSET_DIR/icon_32x32@2x.png" 64
    svg_to_png "$APP_ICON_SVG" "$ICONSET_DIR/icon_128x128.png" 128
    svg_to_png "$APP_ICON_SVG" "$ICONSET_DIR/icon_128x128@2x.png" 256
    svg_to_png "$APP_ICON_SVG" "$ICONSET_DIR/icon_256x256.png" 256
    svg_to_png "$APP_ICON_SVG" "$ICONSET_DIR/icon_256x256@2x.png" 512
    svg_to_png "$APP_ICON_SVG" "$ICONSET_DIR/icon_512x512.png" 512
    svg_to_png "$APP_ICON_SVG" "$ICONSET_DIR/icon_512x512@2x.png" 1024
    
    # Create ICNS file
    iconutil -c icns "$ICONSET_DIR" -o "$ICONS_DIR/icon.icns"
    
    # Clean up
    rm -rf "$ICONSET_DIR"
    
    echo "✅ ICNS file generated"
fi

# Generate ICO file for Windows (using ImageMagick)
echo "🔸 Generating ICO file for Windows..."
magick "$APP_ICON_SVG" -background transparent \
    \( -clone 0 -resize 16x16 \) \
    \( -clone 0 -resize 32x32 \) \
    \( -clone 0 -resize 48x48 \) \
    \( -clone 0 -resize 64x64 \) \
    \( -clone 0 -resize 128x128 \) \
    \( -clone 0 -resize 256x256 \) \
    -delete 0 "$ICONS_DIR/icon.ico"

echo "✅ All icons generated successfully!"
echo ""
echo "📋 Generated files:"
echo "  • App icons: 32x32.png, 128x128.png, 128x128@2x.png, icon.png"
echo "  • Tray icons: tray-icon.png, tray-icon-paused.png, tray-icon-warning.png"
echo "  • Platform icons: icon.icns (macOS), icon.ico (Windows)"
