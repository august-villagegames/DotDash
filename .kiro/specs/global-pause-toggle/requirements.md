# Requirements Document

## Introduction

This feature provides users with the ability to temporarily disable all text expansions without losing their shortcuts or closing the application. This is essential for situations where users need to type commands that might conflict with their shortcuts, or when working in applications where expansions might interfere with normal workflow.

## Requirements

### Requirement 1

**User Story:** As a user, I want a global toggle to pause all expansions, so that I can temporarily disable the expansion engine when needed without affecting my saved shortcuts.

#### Acceptance Criteria

1. WHEN the user toggles expansions off THEN the system SHALL stop monitoring keystrokes for expansion triggers
2. WHEN expansions are paused THEN existing shortcuts SHALL remain saved and unchanged
3. WHEN the user toggles expansions back on THEN the system SHALL resume monitoring keystrokes immediately
4. WHEN expansions are paused THEN the system SHALL maintain all other app functionality (editing shortcuts, settings, etc.)
5. WHEN the app restarts THEN it SHALL remember the previous pause/resume state

### Requirement 2

**User Story:** As a user, I want the pause toggle to be easily accessible from the settings view, so that I can quickly enable or disable expansions when configuring the app.

#### Acceptance Criteria

1. WHEN viewing the settings page THEN the system SHALL display a prominent "Enable Expansions" toggle switch
2. WHEN the toggle is in the "on" position THEN expansions SHALL be active and the UI SHALL indicate active status
3. WHEN the toggle is in the "off" position THEN expansions SHALL be paused and the UI SHALL indicate paused status
4. WHEN the toggle state changes THEN the system SHALL provide immediate visual feedback
5. WHEN expansions are disabled THEN the toggle SHALL show explanatory text about the current state

### Requirement 3

**User Story:** As a user, I want visual indicators throughout the app when expansions are paused, so that I can easily see the current state and understand why expansions aren't working.

#### Acceptance Criteria

1. WHEN expansions are paused THEN the app title bar SHALL display a "Paused" indicator
2. WHEN expansions are paused THEN the shortcuts view SHALL show a banner indicating expansions are disabled
3. WHEN expansions are paused THEN the diagnostics view SHALL clearly show the paused state
4. WHEN viewing the shortcuts list while paused THEN shortcuts SHALL remain visible but with visual indication they're inactive
5. WHEN expansions are paused THEN any attempt to test expansions SHALL show appropriate messaging

### Requirement 4

**User Story:** As a user, I want keyboard shortcuts to quickly toggle expansions on/off, so that I can rapidly enable or disable the feature without navigating through the UI.

#### Acceptance Criteria

1. WHEN the user presses a designated keyboard shortcut THEN the system SHALL toggle the expansion state
2. WHEN the keyboard shortcut is used THEN the system SHALL provide brief visual feedback (notification or menu bar indication)
3. WHEN expansions are toggled via keyboard shortcut THEN all UI elements SHALL update to reflect the new state
4. WHEN the main window is not visible THEN the keyboard shortcut SHALL still function
5. WHEN the keyboard shortcut conflicts with system shortcuts THEN the app SHALL use an alternative combination

### Requirement 5

**User Story:** As a user, I want the pause state to persist across app restarts, so that if I intentionally pause expansions, they remain paused until I explicitly re-enable them.

#### Acceptance Criteria

1. WHEN the app is quit while expansions are paused THEN the paused state SHALL be saved to persistent storage
2. WHEN the app launches THEN it SHALL restore the previous expansion state (paused or active)
3. WHEN launching with expansions paused THEN the system SHALL not start the keystroke monitoring engine
4. WHEN launching with expansions active THEN the system SHALL start monitoring keystrokes normally
5. WHEN the pause state is restored THEN all UI elements SHALL reflect the correct state immediately

### Requirement 6

**User Story:** As a user working in sensitive applications, I want expansions to automatically pause when secure input is detected, so that my shortcuts don't interfere with password fields or secure contexts.

#### Acceptance Criteria

1. WHEN secure input mode is detected THEN the system SHALL temporarily pause expansions automatically
2. WHEN secure input mode ends THEN the system SHALL resume expansions if they were previously active
3. WHEN auto-pausing due to secure input THEN the system SHALL not change the user's manual pause setting
4. WHEN secure input auto-pause occurs THEN the system SHALL log this event for diagnostics
5. WHEN in secure input mode THEN the UI SHALL indicate the temporary pause with appropriate messaging