# Design Document

## Overview

The system tray integration transforms DotDashDash into a proper menu bar application by adding native macOS system tray functionality. This feature provides quick access to core functionality without requiring the main window to be open, aligning with the app's goal of being unobtrusive while remaining easily accessible.

## Architecture

### Component Structure
```
System Tray Integration
├── Tauri Backend (Rust)
│   ├── TrayManager (new module)
│   ├── TrayMenuBuilder (new module)
│   └── TrayEventHandler (new module)
├── Frontend State Management
│   ├── TrayStateProvider (new context)
│   └── Enhanced App.tsx (tray integration)
└── UI Components
    ├── TrayStatusIndicator (new component)
    └── Enhanced SettingsView (dock/tray preferences)
```

### State Management
- Extend existing app state to include tray status and preferences
- Add tray-specific settings to persistent storage
- Implement bidirectional communication between tray and main window

### Data Flow
1. App launches → Initialize tray with current expansion state
2. Tray menu interactions → Update app state and notify main window
3. Main window state changes → Update tray icon and menu items
4. Settings changes → Update tray behavior and visibility

## Components and Interfaces

### Tauri Backend Components

#### TrayManager (Rust)
```rust
pub struct TrayManager {
    tray: Option<SystemTray>,
    expansion_enabled: Arc<AtomicBool>,
    window_handle: Arc<Mutex<Option<Window>>>,
}

impl TrayManager {
    pub fn new() -> Self;
    pub fn initialize(&mut self, app_handle: &AppHandle) -> Result<(), TrayError>;
    pub fn update_expansion_state(&self, enabled: bool);
    pub fn update_icon(&self, state: TrayIconState);
    pub fn show_main_window(&self) -> Result<(), TrayError>;
    pub fn quit_app(&self) -> Result<(), TrayError>;
}
```

#### TrayMenuBuilder (Rust)
```rust
pub struct TrayMenuBuilder;

impl TrayMenuBuilder {
    pub fn build_menu(expansion_enabled: bool) -> SystemTrayMenu;
    pub fn create_toggle_item(enabled: bool) -> CustomMenuItem;
    pub fn create_static_items() -> Vec<CustomMenuItem>;
}
```

#### TrayEventHandler (Rust)
```rust
pub enum TrayEvent {
    ToggleExpansions,
    OpenMainWindow,
    OpenDiagnostics,
    QuitApp,
}

pub struct TrayEventHandler;

impl TrayEventHandler {
    pub fn handle_event(event: TrayEvent, app_state: &AppState) -> Result<(), TrayError>;
}
```

### Frontend Components

#### TrayStateProvider (React Context)
```typescript
interface TrayState {
  isVisible: boolean;
  expansionEnabled: boolean;
  showInDock: boolean;
  startMinimized: boolean;
}

interface TrayActions {
  toggleExpansions: () => Promise<void>;
  showMainWindow: () => Promise<void>;
  updateTrayPreferences: (prefs: Partial<TrayPreferences>) => Promise<void>;
}

export const TrayStateProvider: React.FC<{ children: React.ReactNode }>;
export const useTrayState: () => TrayState & TrayActions;
```

#### Enhanced SettingsView
```typescript
interface TrayPreferences {
  showInDock: boolean;
  startMinimized: boolean;
  trayIconStyle: 'auto' | 'light' | 'dark';
  showNotifications: boolean;
}

// Add tray preferences section to existing SettingsView
```

## Data Models

### Tray Configuration
```rust
#[derive(Serialize, Deserialize, Clone)]
pub struct TrayConfig {
    pub enabled: bool,
    pub show_in_dock: bool,
    pub start_minimized: bool,
    pub icon_style: TrayIconStyle,
    pub show_notifications: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub enum TrayIconStyle {
    Auto,
    Light,
    Dark,
}

#[derive(Serialize, Deserialize, Clone)]
pub enum TrayIconState {
    Active,
    Paused,
    Warning,
    Error,
}
```

### Tauri Commands
```rust
#[tauri::command]
async fn initialize_tray(app_handle: AppHandle) -> Result<(), String>;

#[tauri::command]
async fn update_tray_state(enabled: bool, state: State<TrayManager>) -> Result<(), String>;

#[tauri::command]
async fn toggle_dock_visibility(show: bool, app_handle: AppHandle) -> Result<(), String>;

#[tauri::command]
async fn set_tray_preferences(config: TrayConfig, state: State<TrayManager>) -> Result<(), String>;
```

## Error Handling

### Tray Initialization Errors
- Handle cases where system tray is not available
- Graceful fallback to dock-only mode
- User notification of tray limitations

### Permission and System Errors
- Handle macOS permission requirements
- Manage system tray conflicts with other apps
- Provide clear error messages and recovery options

## Testing Strategy

### Unit Tests
- Tray menu building logic
- State synchronization between tray and main window
- Configuration persistence and loading

### Integration Tests
- Tray initialization and cleanup
- Menu item interactions and state updates
- Window show/hide behavior

### Manual Testing
- System tray appearance in light/dark modes
- Menu functionality across different macOS versions
- Interaction with other menu bar applications

## Implementation Phases

### Phase 1: Basic Tray Integration
- Initialize system tray with basic icon
- Add essential menu items (Open, Pause/Resume, Quit)
- Implement window show/hide functionality

### Phase 2: State Synchronization
- Bidirectional state sync between tray and main window
- Dynamic menu updates based on expansion state
- Tray icon state indicators

### Phase 3: Advanced Features
- Dock visibility toggle
- Start minimized option
- Tray icon customization (light/dark mode)
- Notification integration

### Phase 4: Polish and Optimization
- Smooth animations and transitions
- Memory optimization for tray operations
- Comprehensive error handling and recovery

## Accessibility Considerations

- Ensure tray menu items have proper labels
- Support keyboard navigation where possible
- Provide alternative access methods for users who cannot use system tray
- Follow macOS accessibility guidelines for menu bar applications

## Performance Considerations

- Minimize tray update frequency to reduce system overhead
- Efficient state synchronization to prevent UI lag
- Lazy loading of tray resources
- Memory management for long-running tray operations

## Platform-Specific Implementation Details

### macOS System Tray
- Use NSStatusBar for native integration
- Handle light/dark mode changes automatically
- Support Retina display scaling
- Integrate with macOS notification system

### Icon Design Requirements
- Multiple resolutions (16x16, 32x32 for Retina)
- Template images for automatic color adaptation
- Clear visual states (active, paused, warning, error)
- Consistent with macOS design guidelines

## Security Considerations

- Validate all tray menu interactions
- Secure communication between tray and main application
- Prevent unauthorized access to tray functionality
- Handle potential security restrictions in future macOS versions