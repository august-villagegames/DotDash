# Tray Icon Design Specifications

## Icon Requirements
- **Size**: 16x16 and 32x32 pixels (for Retina support)
- **Format**: PNG with transparency
- **Style**: Template images (black/white for automatic macOS theming)
- **Design**: Simple, recognizable at small sizes

## Icon States

### 1. Active State (`tray-icon.png`)
- **Design**: A small dot (.) followed by three horizontal lines representing text
- **Meaning**: Expansion engine is active and ready
- **Color**: Template black (will adapt to system theme)

### 2. Paused State (`tray-icon-paused.png`)
- **Design**: Base icon with small pause symbol (||) in bottom-right corner
- **Meaning**: Expansion engine is paused
- **Color**: Template black with pause indicator

### 3. Warning State (`tray-icon-warning.png`)
- **Design**: Base icon with small warning triangle (!) in top-right corner
- **Meaning**: Permission issues or configuration problems
- **Color**: Template black with warning indicator

## Technical Requirements
- Use `iconAsTemplate: true` in Tauri config for automatic color adaptation
- Icons should be monochrome (black on transparent background)
- Avoid fine details that won't be visible at 16x16 pixels
- Test visibility in both light and dark menu bars

## Implementation Notes
- Icons are referenced in `tauri.conf.json` and loaded at runtime
- Icon switching is handled programmatically in Rust code
- Tooltip text provides additional context for each state