# System Tray Integration Documentation

## Overview

The system tray integration transforms DotDashDash into a proper menu bar application for macOS. This feature provides quick access to core functionality without requiring the main window to be open.

## Architecture

### Backend Components

#### TrayManager (`src/tray.rs`)
- Manages system tray icon and menu
- Handles tray events and state updates
- Provides error handling and recovery mechanisms
- Implements performance optimizations (throttling, state change detection)

#### Key Features
- **Dynamic Menu Updates**: Menu items change based on expansion state
- **Icon State Management**: Different icons for active, paused, warning, and error states
- **Error Recovery**: Graceful fallback when system tray is unavailable
- **Performance Optimization**: Throttled updates to prevent excessive system calls

### Frontend Components

#### TrayStateProvider (`src/state/tray-store.tsx`)
- React context for tray state management
- Handles communication with backend tray commands
- Manages tray preferences and persistence
- Provides error handling and retry mechanisms

#### Settings Integration
- Tray preferences section in SettingsView
- Controls for dock visibility, startup behavior, and icon style
- Real-time updates to tray configuration

## Usage

### Basic Tray Operations

```typescript
import { useTrayState } from '@/state/tray-store';

function MyComponent() {
  const { 
    expansionEnabled, 
    toggleExpansions, 
    showMainWindow,
    isVisible 
  } = useTrayState();

  // Toggle expansions from UI
  const handleToggle = () => {
    toggleExpansions();
  };

  // Show main window
  const handleShow = () => {
    showMainWindow();
  };

  return (
    <div>
      {isVisible && (
        <button onClick={handleToggle}>
          {expansionEnabled ? 'Pause' : 'Resume'} Expansions
        </button>
      )}
    </div>
  );
}
```

### Tray Preferences

```typescript
const { updateTrayPreferences } = useTrayState();

// Update tray preferences
await updateTrayPreferences({
  showInDock: false,
  startMinimized: true,
  trayIconStyle: 'auto',
  showNotifications: true,
});
```

### Error Handling

```typescript
const { retryTrayInitialization, isVisible } = useTrayState();

// Retry tray initialization if it failed
if (!isVisible) {
  const success = await retryTrayInitialization();
  if (success) {
    console.log('Tray initialized successfully');
  }
}
```

## Tray Menu Structure

The tray menu includes the following items:

1. **Toggle Expansions** - Pause/Resume text expansions
2. **Separator**
3. **Open DotDashDash** - Show main application window
4. **Diagnostics** - Open diagnostics view
5. **Separator**
6. **Quit DotDashDash** - Exit application with cleanup

## Icon States

### Active State
- **Icon**: Standard tray icon
- **Tooltip**: "DotDashDash - Active"
- **Meaning**: Expansion engine is running and ready

### Paused State
- **Icon**: Icon with pause indicator
- **Tooltip**: "DotDashDash - Paused"
- **Meaning**: Expansion engine is paused

### Warning State
- **Icon**: Icon with warning indicator
- **Tooltip**: "DotDashDash - Warning (Check permissions)"
- **Meaning**: Permission issues or configuration problems

### Error State
- **Icon**: Icon with error indicator
- **Tooltip**: "DotDashDash - Error"
- **Meaning**: Critical errors preventing normal operation

## Configuration

### Tauri Configuration (`tauri.conf.json`)

```json
{
  "app": {
    "trayIcon": {
      "iconPath": "icons/tray-icon.png",
      "iconAsTemplate": true,
      "menuOnLeftClick": false,
      "tooltip": "DotDashDash"
    }
  }
}
```

### Rust Dependencies (`Cargo.toml`)

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon", "image-ico", "image-png"] }
```

## Error Handling

### Common Issues and Solutions

#### System Tray Not Available
- **Cause**: System doesn't support system tray or it's disabled
- **Solution**: App falls back to dock-only mode
- **Recovery**: Retry initialization when system conditions change

#### Permission Issues
- **Cause**: macOS security restrictions
- **Solution**: Show appropriate error messages and guidance
- **Recovery**: Prompt user to grant necessary permissions

#### Icon Loading Failures
- **Cause**: Missing or corrupted icon files
- **Solution**: Use fallback icons or default system icons
- **Recovery**: Attempt to reload icons or use text-based indicators

## Performance Considerations

### Optimization Strategies

1. **Update Throttling**: Limit tray updates to prevent excessive system calls
2. **State Change Detection**: Only update when state actually changes
3. **Memoization**: Cache context values to prevent unnecessary re-renders
4. **Lazy Loading**: Load tray resources only when needed

### Performance Monitoring

```rust
// Backend logging for performance monitoring
info!("Tray update took {}ms", duration.as_millis());
debug!("Throttling tray icon update");
```

```typescript
// Frontend performance monitoring
console.time('tray-state-update');
await updateTrayState();
console.timeEnd('tray-state-update');
```

## Testing

### Manual Testing Checklist

- [ ] Tray icon appears in menu bar on app launch
- [ ] Left-click shows main window
- [ ] Right-click shows context menu
- [ ] Menu items respond correctly
- [ ] Icon state changes reflect expansion state
- [ ] Tooltips show correct information
- [ ] Error recovery works when tray is unavailable
- [ ] Preferences persist across app restarts
- [ ] Performance is smooth with frequent updates

### Integration Testing

```typescript
// Test tray state management
describe('TrayState', () => {
  it('should toggle expansion state', async () => {
    const { toggleExpansions, expansionEnabled } = useTrayState();
    const initialState = expansionEnabled;
    
    await toggleExpansions();
    
    expect(expansionEnabled).toBe(!initialState);
  });
});
```

## Troubleshooting

### Common Problems

#### Tray Icon Not Appearing
1. Check if system tray is enabled in macOS
2. Verify icon files exist and are valid
3. Check console for initialization errors
4. Try restarting the application

#### Menu Items Not Working
1. Verify event handlers are properly registered
2. Check for JavaScript errors in console
3. Ensure Tauri commands are properly exposed
4. Test with simplified menu structure

#### Performance Issues
1. Check for excessive tray updates in logs
2. Monitor memory usage during tray operations
3. Verify throttling is working correctly
4. Profile tray-related code paths

### Debug Commands

```bash
# Check tray availability
await invoke('is_tray_available');

# Retry tray initialization
await invoke('retry_tray_initialization');

# Update icon state manually
await invoke('update_tray_icon_state', { stateStr: 'active' });
```

## Future Enhancements

### Planned Features
- [ ] Custom icon themes
- [ ] Animated state transitions
- [ ] Rich notifications
- [ ] Quick actions menu
- [ ] Keyboard shortcuts for tray operations

### Platform Support
- [ ] Windows system tray support
- [ ] Linux system tray support
- [ ] Cross-platform icon management

## Security Considerations

- Tray operations are sandboxed within Tauri's security model
- No sensitive data is exposed through tray interactions
- All tray commands require proper authentication
- Icon files are validated before loading

## Accessibility

- Tray menu items have proper labels for screen readers
- Keyboard navigation is supported where possible
- High contrast mode compatibility
- VoiceOver integration on macOS