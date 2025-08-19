# Requirements Document

## Introduction

This feature improves the user experience when creating or editing shortcuts that conflict with existing ones. Currently, the app shows basic validation errors, but users need better guidance and options for resolving conflicts. This enhancement will provide inline conflict detection, clear resolution options, and improved feedback to help users manage their shortcuts more effectively.

## Requirements

### Requirement 1

**User Story:** As a user creating a new shortcut, I want to see immediate feedback when my command conflicts with an existing one, so that I can resolve the conflict before saving.

#### Acceptance Criteria

1. WHEN a user types a command that matches an existing shortcut THEN the system SHALL display an inline warning message below the command field
2. WHEN the conflict warning is shown THEN the system SHALL highlight the conflicting command with a warning color
3. WHEN a user continues typing to resolve the conflict THEN the warning SHALL disappear immediately once the conflict is resolved
4. WHEN the save button is clicked with an active conflict THEN the system SHALL prevent saving and focus on the command field

### Requirement 2

**User Story:** As a user editing an existing shortcut, I want to change its command without accidentally creating conflicts with other shortcuts, so that I can maintain a clean set of unique commands.

#### Acceptance Criteria

1. WHEN editing an existing shortcut's command THEN the system SHALL exclude the current shortcut from conflict detection
2. WHEN the edited command conflicts with another shortcut THEN the system SHALL show the same inline warning as for new shortcuts
3. WHEN saving an edited shortcut with conflicts THEN the system SHALL prevent the save operation
4. WHEN reverting changes to the original command THEN any conflict warnings SHALL be cleared

### Requirement 3

**User Story:** As a user who encounters a command conflict, I want clear options for resolving it, so that I can quickly decide how to proceed without losing my work.

#### Acceptance Criteria

1. WHEN a conflict is detected THEN the system SHALL display the existing shortcut's details (command and replacement text preview)
2. WHEN a conflict warning is shown THEN the system SHALL provide actionable resolution options
3. WHEN the user clicks "Edit existing" THEN the system SHALL switch to editing the conflicting shortcut
4. WHEN the user clicks "Use different command" THEN the system SHALL focus the command field and provide command suggestions

### Requirement 4

**User Story:** As a user importing shortcuts, I want to handle duplicates gracefully with clear options, so that I can merge my data without losing existing shortcuts or creating conflicts.

#### Acceptance Criteria

1. WHEN importing a file with duplicate commands THEN the system SHALL show a conflict resolution dialog
2. WHEN conflicts are detected during import THEN the system SHALL list all conflicting shortcuts with their details
3. WHEN resolving import conflicts THEN the system SHALL provide options: Skip, Overwrite, or Rename
4. WHEN "Rename" is selected THEN the system SHALL suggest alternative command names automatically
5. WHEN import conflicts are resolved THEN the system SHALL complete the import and show a summary of actions taken

### Requirement 5

**User Story:** As a user managing many shortcuts, I want helpful suggestions when resolving conflicts, so that I can quickly find alternative command names that follow the app's conventions.

#### Acceptance Criteria

1. WHEN a conflict occurs THEN the system SHALL suggest 3 alternative command names based on the original
2. WHEN generating suggestions THEN the system SHALL follow the app's naming rules (period prefix, alphanumeric + underscore)
3. WHEN a suggested command is clicked THEN the system SHALL populate the command field with that suggestion
4. WHEN all suggestions also conflict THEN the system SHALL generate additional unique suggestions
5. WHEN the user types a custom alternative THEN the system SHALL validate it in real-time