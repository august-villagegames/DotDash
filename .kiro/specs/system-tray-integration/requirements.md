# Requirements Document

## Introduction

This feature transforms DotDashDash into a proper menu bar application by adding system tray integration. Users will be able to access core functionality directly from the menu bar, control the expansion engine, and maintain the app's presence without cluttering the dock. This aligns with the app's goal of being unobtrusive while remaining easily accessible.

## Requirements

### Requirement 1

**User Story:** As a user, I want DotDashDash to appear in the menu bar with a recognizable icon, so that I can quickly access the app without searching through my applications.

#### Acceptance Criteria

1. WHEN the app launches THEN the system SHALL display a tray icon in the macOS menu bar
2. WHEN the tray icon is displayed THEN it SHALL use a clear, recognizable icon that represents text expansion
3. WHEN the system is in dark mode THEN the tray icon SHALL adapt to use appropriate contrast
4. WHEN the system is in light mode THEN the tray icon SHALL use colors appropriate for light backgrounds
5. WHEN the expansion engine is paused THEN the tray icon SHALL visually indicate the paused state

### Requirement 2

**User Story:** As a user, I want to left-click the tray icon to open the main shortcuts window, so that I can quickly access my shortcuts for editing.

#### Acceptance Criteria

1. WHEN the user left-clicks the tray icon THEN the system SHALL open the main DotDashDash window
2. WHEN the main window is already open THEN left-clicking SHALL bring it to the foreground
3. WHEN the main window opens THEN it SHALL appear in the shortcuts view by default
4. WHEN the window is minimized THEN left-clicking the tray icon SHALL restore it to its previous size and position

### Requirement 3

**User Story:** As a user, I want to right-click the tray icon to see a context menu with essential controls, so that I can perform common actions without opening the main window.

#### Acceptance Criteria

1. WHEN the user right-clicks the tray icon THEN the system SHALL display a context menu
2. WHEN the context menu is shown THEN it SHALL include "Pause/Resume Expansions" toggle
3. WHEN the context menu is shown THEN it SHALL include "Open DotDashDash" option
4. WHEN the context menu is shown THEN it SHALL include "Diagnostics" option
5. WHEN the context menu is shown THEN it SHALL include "Quit DotDashDash" option
6. WHEN "Pause Expansions" is selected THEN the system SHALL disable the expansion engine and update the tray icon
7. WHEN "Resume Expansions" is selected THEN the system SHALL enable the expansion engine and update the tray icon

### Requirement 4

**User Story:** As a user, I want the app to hide from the dock when using tray mode, so that it doesn't take up space in my dock while remaining accessible from the menu bar.

#### Acceptance Criteria

1. WHEN tray integration is enabled THEN the system SHALL hide the app icon from the dock
2. WHEN the app is hidden from dock THEN it SHALL still appear in Activity Monitor and Force Quit applications
3. WHEN the main window is open THEN the app SHALL remain hidden from the dock
4. WHEN the user enables "Show in Dock" setting THEN the app SHALL appear in both dock and menu bar
5. WHEN the app quits THEN the tray icon SHALL be removed from the menu bar

### Requirement 5

**User Story:** As a user, I want visual feedback in the tray icon about the expansion engine status, so that I can quickly see whether expansions are active or paused.

#### Acceptance Criteria

1. WHEN expansions are active THEN the tray icon SHALL display in its normal state
2. WHEN expansions are paused THEN the tray icon SHALL display with a visual indicator (dimmed or with pause symbol)
3. WHEN there's a permission issue THEN the tray icon SHALL display with a warning indicator
4. WHEN hovering over the tray icon THEN the system SHALL show a tooltip with current status
5. WHEN the expansion engine encounters an error THEN the tray icon SHALL briefly indicate the error state

### Requirement 6

**User Story:** As a user, I want to control whether the app starts at login and appears in the tray, so that I can customize how DotDashDash integrates with my system startup.

#### Acceptance Criteria

1. WHEN "Start at login" is enabled in settings THEN the app SHALL launch automatically when the user logs in
2. WHEN starting at login THEN the app SHALL launch directly to tray mode without showing the main window
3. WHEN the app starts at login THEN it SHALL respect the user's pause/resume preference from the previous session
4. WHEN "Start at login" is disabled THEN the app SHALL remove itself from login items
5. WHEN starting manually THEN the app SHALL show the main window by default unless configured otherwise