# Design Document

## Overview

The duplicate handling UX enhancement improves conflict resolution when users create or edit shortcuts with duplicate commands. The design focuses on providing immediate feedback, clear resolution options, and helpful suggestions while maintaining the existing shadcn/ui design system and React architecture.

## Architecture

### Component Structure
```
ShortcutsView
├── ShortcutsList (existing)
├── EditorCard (enhanced)
│   ├── CommandInput (enhanced with conflict detection)
│   ├── ConflictWarning (new component)
│   ├── ConflictResolution (new component)
│   └── CommandSuggestions (new component)
└── ImportConflictDialog (new component)
```

### State Management
- Extend existing `shortcuts-store.tsx` with conflict detection utilities
- Add real-time validation state to `EditorCard` component
- Implement conflict resolution state for import operations

### Data Flow
1. User types in command field → Real-time conflict detection
2. Conflict detected → Show warning with resolution options
3. User selects resolution → Update UI and provide suggestions
4. Import operation → Batch conflict detection and resolution dialog

## Components and Interfaces

### Enhanced EditorCard Component
```typescript
interface EditorCardProps {
  initial: ExpansionRule | null;
  onSave: (rule: { command: string; replacementText: string }) => void;
  onDelete: () => void;
  allRules: ExpansionRule[];
  onEditConflicting?: (ruleId: string) => void; // New prop
}

interface ConflictState {
  hasConflict: boolean;
  conflictingRule: ExpansionRule | null;
  suggestions: string[];
}
```

### ConflictWarning Component
```typescript
interface ConflictWarningProps {
  conflictingRule: ExpansionRule;
  onEditConflicting: () => void;
  onDismiss: () => void;
}
```

Displays:
- Warning icon and message
- Preview of conflicting shortcut (command + truncated replacement text)
- "Edit existing shortcut" button
- "Use different command" button

### CommandSuggestions Component
```typescript
interface CommandSuggestionsProps {
  originalCommand: string;
  existingCommands: string[];
  onSuggestionSelect: (suggestion: string) => void;
}
```

Features:
- Generates 3-5 alternative command suggestions
- Uses intelligent naming patterns (append numbers, synonyms, abbreviations)
- Validates suggestions against existing commands
- Clickable suggestion chips

### ImportConflictDialog Component
```typescript
interface ImportConflictDialogProps {
  conflicts: ConflictItem[];
  onResolve: (resolutions: ConflictResolution[]) => void;
  onCancel: () => void;
}

interface ConflictItem {
  importedRule: ExpansionRule;
  existingRule: ExpansionRule;
  suggestedAlternatives: string[];
}

interface ConflictResolution {
  action: 'skip' | 'overwrite' | 'rename';
  newCommand?: string;
  ruleId: string;
}
```

## Data Models

### Conflict Detection Utilities
```typescript
// Add to shortcuts-store.tsx or new conflict-utils.ts
export function detectConflict(
  command: string, 
  existingRules: ExpansionRule[], 
  excludeId?: string
): ExpansionRule | null;

export function generateCommandSuggestions(
  baseCommand: string, 
  existingCommands: string[]
): string[];

export function detectImportConflicts(
  importedRules: ExpansionRule[], 
  existingRules: ExpansionRule[]
): ConflictItem[];
```

### Command Suggestion Algorithm
1. **Numeric suffixes**: `.sig` → `.sig2`, `.sig3`
2. **Descriptive suffixes**: `.sig` → `.signature`, `.sig_work`
3. **Abbreviation variations**: `.meeting` → `.meet`, `.mtg`
4. **Context-based**: Analyze replacement text for keywords

## Error Handling

### Validation Enhancement
- Extend existing `validateRule` function to return conflict information
- Add real-time validation with debouncing (300ms delay)
- Provide specific error messages for different conflict types

### User Feedback
- Inline warnings with clear visual hierarchy
- Non-blocking notifications for successful conflict resolution
- Progress indicators for import conflict resolution

## Testing Strategy

### Unit Tests
- Conflict detection logic with edge cases
- Command suggestion generation algorithms
- Import conflict resolution state management

### Integration Tests
- Real-time conflict detection in editor
- Conflict resolution workflow end-to-end
- Import dialog with various conflict scenarios

### User Experience Tests
- Typing performance with real-time validation
- Visual feedback clarity and timing
- Accessibility with screen readers

## Implementation Phases

### Phase 1: Real-time Conflict Detection
- Enhance EditorCard with conflict detection
- Add ConflictWarning component
- Implement basic command suggestions

### Phase 2: Advanced Resolution Options
- Add CommandSuggestions component with intelligent algorithms
- Implement "Edit conflicting shortcut" navigation
- Enhanced visual feedback and animations

### Phase 3: Import Conflict Resolution
- Create ImportConflictDialog component
- Batch conflict detection and resolution
- Import summary and rollback capabilities

## Accessibility Considerations

- ARIA labels for conflict warnings and suggestions
- Keyboard navigation for suggestion selection
- Screen reader announcements for conflict state changes
- High contrast support for warning indicators
- Focus management during conflict resolution

## Performance Considerations

- Debounced conflict detection to avoid excessive validation
- Memoized suggestion generation
- Efficient conflict detection algorithms (O(1) lookup using Map)
- Lazy loading of suggestion algorithms
- Minimal re-renders during typing