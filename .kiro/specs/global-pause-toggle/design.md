# Design Document

## Overview

The global pause toggle feature provides users with the ability to temporarily disable all text expansions without losing their shortcuts or closing the application. This is essential for situations where users need to type commands that might conflict with their shortcuts, or when working in applications where expansions might interfere with normal workflow.

## Architecture

### Component Structure
```
Global Pause Toggle
├── Backend State Management (Rust)
│   ├── Enhanced EngineState (existing)
│   ├── Pause/Resume Commands
│   └── State Persistence
├── Frontend State Management
│   ├── Enhanced TrayStateProvider (existing)
│   ├── PauseToggleProvider (new context)
│   └── Settings Integration
└── UI Components
    ├── PauseToggleButton (new component)
    ├── PauseStatusIndicator (new component)
    └── Enhanced SettingsView (existing)
```

### State Management
- Extend existing expansion engine state to include pause functionality
- Integrate with tray state management for synchronized updates
- Add persistent storage for pause state across app restarts
- Implement secure input detection for automatic pausing

### Data Flow
1. User triggers pause → Update engine state → Notify all UI components
2. App restart → Restore previous pause state → Update UI accordingly
3. Secure input detected → Auto-pause → Restore when secure input ends
4. Tray interaction → Toggle state → Sync with main window

## Components and Interfaces

### Backend Components

#### Enhanced EngineState (Rust)
```rust
pub struct EngineState {
    // Existing fields...
    paused_by_user: Arc<AtomicBool>,
    paused_by_secure_input: Arc<AtomicBool>,
    pause_state_file: String,
}

impl EngineState {
    pub fn pause_expansions(&self, by_user: bool);
    pub fn resume_expansions(&self, by_user: bool);
    pub fn is_paused(&self) -> bool;
    pub fn get_pause_reason(&self) -> PauseReason;
    pub fn save_pause_state(&self) -> Result<(), Error>;
    pub fn load_pause_state(&self) -> Result<(), Error>;
}

#[derive(Debug, Clone)]
pub enum PauseReason {
    UserRequested,
    SecureInput,
    Both,
    NotPaused,
}
```

#### Tauri Commands
```rust
#[tauri::command]
async fn toggle_global_pause(state: State<EngineState>) -> Result<bool, String>;

#[tauri::command]
async fn get_pause_state(state: State<EngineState>) -> Result<PauseStateInfo, String>;

#[tauri::command]
async fn set_pause_state(paused: bool, state: State<EngineState>) -> Result<(), String>;
```

### Frontend Components

#### PauseToggleProvider (React Context)
```typescript
interface PauseState {
  isPaused: boolean;
  pauseReason: 'user' | 'secure-input' | 'both' | 'none';
  canResume: boolean;
}

interface PauseActions {
  togglePause: () => Promise<void>;
  pauseExpansions: () => Promise<void>;
  resumeExpansions: () => Promise<void>;
  refreshPauseState: () => Promise<void>;
}

export const PauseToggleProvider: React.FC<{ children: React.ReactNode }>;
export const usePauseToggle: () => PauseState & PauseActions;
```

#### PauseToggleButton Component
```typescript
interface PauseToggleButtonProps {
  variant?: 'default' | 'compact' | 'icon-only';
  showLabel?: boolean;
  showStatus?: boolean;
  className?: string;
}

export const PauseToggleButton: React.FC<PauseToggleButtonProps>;
```

#### PauseStatusIndicator Component
```typescript
interface PauseStatusIndicatorProps {
  showReason?: boolean;
  showIcon?: boolean;
  variant?: 'banner' | 'badge' | 'tooltip';
}

export const PauseStatusIndicator: React.FC<PauseStatusIndicatorProps>;
```

## Data Models

### Pause State Information
```rust
#[derive(Serialize, Deserialize, Clone)]
pub struct PauseStateInfo {
    pub is_paused: bool,
    pub paused_by_user: bool,
    pub paused_by_secure_input: bool,
    pub pause_timestamp: Option<String>,
    pub can_resume: bool,
}
```

### Persistent Storage
```rust
#[derive(Serialize, Deserialize)]
pub struct PauseConfig {
    pub user_paused: bool,
    pub auto_pause_secure_input: bool,
    pub remember_pause_state: bool,
    pub pause_keyboard_shortcut: Option<String>,
}
```

## Error Handling

### State Synchronization Errors
- Handle cases where frontend and backend states become out of sync
- Implement automatic state reconciliation
- Provide user feedback when state updates fail

### Secure Input Detection Errors
- Graceful handling when secure input detection fails
- Fallback to manual pause/resume only
- Clear user messaging about automatic pause limitations

### Persistence Errors
- Handle file system errors when saving/loading pause state
- Fallback to in-memory state if persistence fails
- User notification of persistence issues

## Testing Strategy

### Unit Tests
- Pause/resume state transitions
- Secure input detection logic
- State persistence and restoration
- Error handling scenarios

### Integration Tests
- Frontend-backend state synchronization
- Tray integration with pause toggle
- Settings persistence across app restarts
- Keyboard shortcut functionality

### User Experience Tests
- Pause toggle responsiveness
- Visual feedback clarity
- State indicator accuracy
- Cross-component state consistency

## Implementation Phases

### Phase 1: Core Pause Functionality
- Extend backend engine state with pause capabilities
- Implement basic pause/resume commands
- Add frontend state management
- Create basic toggle UI component

### Phase 2: UI Integration
- Add pause toggle to settings view
- Implement status indicators throughout the app
- Integrate with existing tray functionality
- Add visual feedback and animations

### Phase 3: Advanced Features
- Implement secure input detection
- Add keyboard shortcut support
- Create pause state persistence
- Add comprehensive error handling

### Phase 4: Polish and Optimization
- Optimize state synchronization performance
- Add smooth UI transitions
- Implement comprehensive logging
- Add accessibility features

## Accessibility Considerations

- Ensure pause toggle is keyboard accessible
- Provide clear screen reader announcements for state changes
- Use appropriate ARIA labels and roles
- Support high contrast mode for status indicators
- Implement focus management for pause-related UI

## Performance Considerations

- Minimize overhead when checking pause state during expansion
- Efficient state synchronization between components
- Lazy loading of pause-related UI components
- Optimized secure input detection to avoid performance impact

## Security Considerations

- Secure input detection should not log sensitive information
- Pause state persistence should not expose sensitive data
- Keyboard shortcuts should not conflict with system shortcuts
- Proper validation of all pause-related commands

## Platform-Specific Implementation

### macOS Secure Input Detection
- Use Carbon framework APIs to detect secure input fields
- Handle password fields, secure text inputs, and system dialogs
- Integrate with existing accessibility permission system

### State Persistence
- Use application support directory for pause state storage
- Atomic file operations to prevent corruption
- Proper file permissions and security

## User Experience Design

### Visual Feedback
- Clear pause/resume button states
- Consistent iconography across all pause-related UI
- Subtle but noticeable status indicators
- Smooth transitions between states

### Messaging
- Clear explanations of pause reasons
- Helpful tooltips and status messages
- Non-intrusive notifications for automatic pause/resume
- Contextual help for pause-related features

## Integration Points

### Existing Systems
- **Expansion Engine**: Core pause/resume functionality
- **Tray Integration**: Menu item updates and state sync
- **Settings System**: Pause preferences and configuration
- **Shortcuts System**: No direct integration needed

### Future Enhancements
- **Profiles System**: Per-profile pause states
- **Scheduling**: Time-based automatic pause/resume
- **Application Detection**: App-specific pause rules
- **Team Features**: Shared pause policies