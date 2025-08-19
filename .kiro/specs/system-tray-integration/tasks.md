# Implementation Plan

- [x] 1. Add Tauri system tray dependencies
  - Add `tauri-plugin-system-tray` to Cargo.toml dependencies
  - Configure system tray permissions in tauri.conf.json
  - Add required macOS entitlements for system tray access
  - _Requirements: 1.1, 1.2_

- [x] 2. Create tray icon assets
  - Design tray icons for different states (active, paused, warning)
  - Create template images for light/dark mode compatibility
  - Add icons in multiple resolutions (16x16, 32x32) for Retina support
  - Place icons in appropriate Tauri resource directories
  - _Requirements: 1.3, 1.4, 5.1, 5.2_

- [x] 3. Implement basic tray initialization in Rust
  - Create TrayManager struct in new `src/tray.rs` module
  - Implement tray initialization with basic icon and menu
  - Add essential menu items: "Open DotDashDash", "Quit"
  - Wire tray initialization into main app startup
  - _Requirements: 1.1, 3.3, 3.5_

- [x] 4. Add tray menu functionality
  - Implement "Open DotDashDash" menu item to show main window
  - Add "Pause/Resume Expansions" toggle menu item
  - Create "Quit DotDashDash" functionality with proper cleanup
  - Handle tray menu click events and route to appropriate handlers
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.6, 3.7_

- [x] 5. Implement window show/hide behavior
  - Add logic to show main window when tray icon is left-clicked
  - Implement window restoration from minimized state
  - Handle window focus and bring-to-front functionality
  - Add window positioning and size restoration
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Create tray state management in frontend
  - Add TrayStateProvider React context for tray state management
  - Implement useTrayState hook for accessing tray functionality
  - Add Tauri commands for tray state communication
  - Create bidirectional state sync between tray and main window
  - _Requirements: 3.6, 3.7, 5.3, 5.4_

- [x] 7. Add dynamic tray icon states
  - Implement tray icon updates based on expansion engine state
  - Add visual indicators for paused, warning, and error states
  - Create smooth icon transitions and state changes
  - Add tooltip text showing current status on hover
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 8. Implement dock visibility toggle
  - Add Tauri command to show/hide app from dock
  - Create settings UI for dock visibility preference
  - Implement dock icon management with proper state persistence
  - Handle edge cases when switching between dock and tray-only modes
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9. Add tray preferences to SettingsView
  - Create tray preferences section in SettingsView component
  - Add toggles for "Show in Dock" and "Start minimized" options
  - Implement tray icon style selection (auto, light, dark)
  - Add notification preferences for tray interactions
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10. Implement start-at-login with tray integration
  - Modify existing start-at-login functionality to support tray mode
  - Add option to start minimized to tray without showing main window
  - Implement proper app state restoration when starting from tray
  - Handle expansion engine initialization in tray-only startup mode
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 11. Add error handling and recovery
  - Implement graceful fallback when system tray is unavailable
  - Add error handling for tray initialization failures
  - Create user notifications for tray-related errors
  - Implement automatic recovery and retry mechanisms
  - _Requirements: Error handling and system reliability_

- [ ] 12. Write comprehensive tests
  - Create unit tests for tray manager and menu building logic
  - Add integration tests for tray-window communication
  - Test tray functionality across different macOS versions
  - Verify accessibility and keyboard navigation support
  - _Requirements: All requirements validation_

- [x] 13. Performance optimization and polish
  - Optimize tray update frequency and memory usage
  - Add smooth animations for tray icon state changes
  - Implement efficient state synchronization mechanisms
  - Add comprehensive logging for tray operations
  - _Requirements: Performance and user experience_

- [x] 14. Documentation and final testing
  - Document tray functionality and user interactions
  - Create troubleshooting guide for tray-related issues
  - Perform comprehensive manual testing on different macOS versions
  - Validate all accessibility requirements and guidelines
  - _Requirements: Documentation and quality assurance_