# Implementation Plan

- [x] 1. Create conflict detection utilities
  - Create `src/lib/conflict-utils.ts` with conflict detection functions
  - Implement `detectConflict` function for real-time validation
  - Write unit tests for conflict detection logic
  - _Requirements: 1.1, 2.2_

- [x] 2. Implement command suggestion algorithms
  - Add `generateCommandSuggestions` function with intelligent naming patterns
  - Implement numeric suffix generation (`.sig` → `.sig2`, `.sig3`)
  - Add descriptive suffix patterns based on common text expansion conventions
  - Create unit tests for suggestion generation
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 3. Create ConflictWarning component
  - Build new React component in `src/components/ConflictWarning.tsx`
  - Implement warning UI with shadcn/ui components (Alert, Button)
  - Add props for conflicting rule display and action handlers
  - Style with appropriate warning colors and icons
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [x] 4. Create CommandSuggestions component
  - Build new React component in `src/components/CommandSuggestions.tsx`
  - Implement clickable suggestion chips using shadcn/ui Badge components
  - Add keyboard navigation support for accessibility
  - Handle suggestion selection and validation
  - _Requirements: 5.1, 5.3, 5.5_

- [x] 5. Enhance EditorCard with real-time conflict detection
  - Modify `src/views/ShortcutsView.tsx` EditorCard component
  - Add conflict state management with useState hook
  - Implement debounced validation on command input changes
  - Integrate ConflictWarning and CommandSuggestions components
  - _Requirements: 1.1, 1.3, 2.1, 2.2_

- [x] 6. Add conflict resolution actions to EditorCard
  - Implement "Edit existing shortcut" functionality in ShortcutsView
  - Add navigation to conflicting shortcut when resolution button clicked
  - Update save prevention logic when conflicts exist
  - Add focus management for better UX
  - _Requirements: 1.4, 3.3, 3.4_

- [x] 7. Create import conflict detection system
  - Add `detectImportConflicts` function to conflict utilities
  - Modify `parseRulesFile` in `src/lib/storage.ts` to return conflict information
  - Create data structures for batch conflict resolution
  - Write unit tests for import conflict detection
  - _Requirements: 4.1, 4.2_

- [x] 8. Build ImportConflictDialog component
  - Create new React component in `src/components/ImportConflictDialog.tsx`
  - Implement dialog UI using shadcn/ui Dialog components
  - Add conflict list with resolution options (Skip, Overwrite, Rename)
  - Integrate command suggestions for rename operations
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 9. Integrate import conflict resolution in SettingsView
  - Modify `src/views/SettingsView.tsx` import handler
  - Add ImportConflictDialog to import workflow
  - Implement batch resolution processing
  - Add import summary with actions taken
  - _Requirements: 4.5_

- [x] 10. Add visual feedback and polish
  - Enhance conflict warning styling with animations
  - Add loading states for suggestion generation
  - Implement success notifications for conflict resolution
  - Add ARIA labels and screen reader support
  - _Requirements: 1.2, 1.3, 5.5_

- [x] 11. Write integration tests
  - Create tests for real-time conflict detection workflow
  - Test conflict resolution user flows end-to-end
  - Add tests for import conflict resolution scenarios
  - Verify accessibility features work correctly
  - _Requirements: All requirements validation_

- [x] 12. Performance optimization and cleanup
  - Optimize conflict detection with memoization
  - Add performance monitoring for real-time validation
  - Clean up any unused code or dependencies
  - Update existing validation logic to use new conflict system
  - _Requirements: Performance and maintainability_