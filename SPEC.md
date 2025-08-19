## Dot‑Dash — Spec-Driven Development Guide

## Product vision
- Build a fast, unobtrusive macOS text expander that lets users define shortcuts prefixed with “.” and expand them anywhere system-wide, with minimal setup and maximum reliability.

## In-scope platforms and distribution
- macOS 13+ on Apple Silicon and Intel.
- Distributed outside the Mac App Store to avoid sandbox limitations.
- Must be Developer ID signed and notarized.
- MUST USE SHAD CN component library for UI. we will then style it based on this.

## Personas and primary use cases
- Professionals, support agents, developers, students who need system-wide expansion for repetitive text, signatures, snippets.
- Use cases: insert signature, canned response, meeting agenda, code snippet, multi-line notes.

## Core experience principles
- Immediate, dependable expansion with zero visible lag.
- Minimal UI; lives in the menu bar.
- Safe by default: expansions don’t surprise or corrupt content.
- Transparent privacy; data stays local; no keystroke logging.
- Make sure all styling is controlled and set globally unless impossible otherwise.

## UX flows

### First run onboarding
- Single-page explainer: why Accessibility permissions are required, what is monitored, what is not.
- Button opens System Settings to Accessibility pane.
- Poll unobtrusively; auto-start expansion when permission is granted.
- Do not request Automation (Apple Events) initially. Explain app works fully without it; advanced features may require it later.

### Menu bar
- Left-click opens the “Shortcuts” window.
- Menu items: Edit Shortcuts…, Enable/Disable Expansions (toggle), Diagnostics…, Help, Quit.
- Diagnostics opens a pane showing permission state and link to local log viewer.

### Shortcuts window
- Two-pane layout:
  - Left: searchable list of shortcuts; sort by command or last updated.
  - Right: editor form for selected/new shortcut.
- Form fields:
  - Command input (validated per rules below).
  - Replacement text input (multi-line; plain text v1; rich text later).
- Controls: New, Duplicate, Delete (with confirm), Save on submit.
- Live plain-text preview of expansion.
- Reserved space for validation messages to avoid layout shifts.

### Expansion behavior (system-wide)
- Shortcut trigger: a period `.` followed by an identifier that passes validation.
- Default expansion timing: when a terminator is typed indicating token end.
  - Terminators: whitespace, return, tab, punctuation; configurable.
- After expansion, original token is removed and replaced with replacement text.
- If expansion cannot occur (e.g., paste blocked), show a subtle menu bar notification; do not modify user text.

### Settings (in-app)
- Enable/disable expansions toggle.
- Expansion timing policy: on terminator (default) or immediate.
- Paste mode preference: preserve formatting when possible vs force plain text (applies when rich text arrives).
- Import/Export rules (JSON) with duplicate handling: skip, overwrite, rename.
- Start at login toggle.
- Optional sound/visual feedback on expansion.

## Data model
- ExpansionRule
  - id: UUID
  - command: String
  - replacementText: String (plain text v1; later a second rich-text payload)
  - createdAt: Date
  - updatedAt: Date
- Persistence
  - Local Application Support directory under app-specific folder.
  - Atomic writes; JSON file with top-level `version` and array of rules.
  - Import/export use the same schema; version gates migration.

## Validation rules — command
- Must start with a period `.`.
- Total length must be > 4 characters (including the period).
- Allowed characters after the period: letters, numbers, underscores. No spaces or hyphens.
- Maximum length: 50 characters total.
- No consecutive underscores `__`.
- No leading or trailing underscore after the period.
- Must be unique across rules (case-insensitive). Editing a rule may keep its own name.
- Reserved commands (case-insensitive): `.help`, `.settings`, `.about`, `.quit`, `.exit`, `.version`, `.info`.

## Validation rules — replacement text
- Must not be empty.
- Maximum length 10,000 characters.
- Must not contain null characters.
- Maximum 100 lines.

## Performance and safety requirements
- Expansion latency under 100ms after the terminator.
- Keyboard monitor introduces no perceivable input lag while typing.
- Prevent runaway loops: disable detection during synthetic input; re-enable immediately after.
- Idle CPU/memory should be negligible and stable.
- Robust across mainstream apps (browsers, Mail, Notes, Pages, Slack, editors). Known limitations (password fields, secure inputs, some terminals) documented.

## Privacy and security
- No network access required for core features.
- Never log raw keystrokes or store typed non-shortcut input.
- Only store user-defined shortcuts locally.
- Clear privacy statement within the app.
- Request only minimal permissions: Accessibility (required), Input Monitoring (if applicable), optional Automation via explicit user action.

## Permissions and macOS constraints (required behaviors)
- Accessibility permission is required for global keyboard monitoring and synthetic input:
  - Open correct System Settings pane on request.
  - Detect grant and auto-start expansion.
  - Handle revocation by pausing expansion and presenting guidance.
- Automation (Apple Events) permission is optional:
  - Attempt only from explicit, user-initiated actions to satisfy TCC behavior.
  - Core features must not depend on Automation.
- App must be Developer ID signed and notarized; non-notarized builds are unacceptable for distribution.

## Error handling and diagnostics
- Non-intrusive notices for failures (e.g., “Expansion blocked here”).
- In-app Diagnostics panel shows: app version/build, entitlement checks, permission states, last expansion attempt result, link to local log tail.
- Local text log contains operational events and timestamps only; no keystrokes or user content.

## Accessibility (a11y)
- Full keyboard navigation and VoiceOver labels on all controls.
- High-contrast tokens that respect light/dark themes.
- Respect system font size and reduce-motion settings where feasible.

## Internationalization and input methods
- Shortcut parsing must be stable across common keyboard layouts.
- Commands are ASCII; validation restricts to alphanumerics and underscore; document limitation and future plan.
- Do not expand during IME composition; only after commit.

## Compatibility requirements
- Maintain consistent content in:
  - Editable web inputs (Safari/Chrome),
  - Native text areas (Apple apps),
  - Electron apps,
  - IDEs and terminals (document exceptions).
- Never expand inside secure text fields; suppress expansion silently.

## Settings and persistence behavior
- Auto-save changes; no manual Save button.
- Deletion offers transient Undo or standard Edit > Undo when feasible.
- Import/export validates and reports duplicates with user choices.

## Acceptance criteria — functional
- CRUD on rules updates UI immediately and persists across restarts.
- Shortcut validation enforced on submit with clear, specific messages.
- Search filters by command and replacement contents, case-insensitive.
- Expansion triggers only for valid command followed by configured terminator; replaces exactly the token and inserts replacement text.
- No expansion in secure fields; original text remains intact.
- Global disable prevents expansion while keeping the UI responsive; menu shows disabled state.
- First-run obtains Accessibility permission and begins expansion without app restart.
- Diagnostics accurately reports permissions and recent outcomes.

## Acceptance criteria — non-functional
- Startup-to-ready under 2s after permissions granted.
- Expansion under 100ms after terminator in representative apps.
- Idle monitoring overhead ~<1ms per event on average.
- No crash without Automation permission; no hangs around permission prompts.
- Memory footprint steady during prolonged sessions.

## Test plan (spec-driven)
- Validation tests:
  - Valid/invalid cases and boundaries for each rule.
  - Case-insensitive uniqueness; edits preserve identity.
- Expansion tests (manual/UI/integration):
  - Expansion after whitespace, return, tab, punctuation; no mid-word expansion.
  - Multiple expansions; rapid typing; backspace mid-token; cursor moves.
  - Secure field detection: no expansion; content preserved.
  - Disabled mode: no expansion occurs.
- Compatibility matrix:
  - Verify in Safari, Chrome, Mail, Pages, Notes, Slack, VS Code/Xcode, Terminal/iTerm; document deviations.
- Permission flows:
  - First-run without Accessibility: prompt, poll, auto-enable.
  - Revocation mid-session: pause with guidance.
  - Optional Automation: only on explicit user action; core works without it.
- Persistence:
  - Atomic save, reload preserves order and timestamps.
  - Import/export duplicate handling across policies.
- Performance:
  - Measure latency from terminator press to insertion.
  - Verify runaway loop guard prevents recursive triggers.

## Observability requirements
- Local log with timestamps for permission changes, expansion attempts, outcomes, and errors. Never include user content or keystrokes.
- Diagnostic panel surfaces summarized status and “Open Logs” action.

## Roadmap (post‑v1)
- Rich text snippets with formatting preservation; user preference for paste mode.
- Placeholders/variables (date, clipboard, user-defined inputs).
- Snippet folders/tags, favorites, recent history in menu bar.
- iCloud or file-based sync with conflict resolution.
- Optional alternate trigger characters.
- Teams/shared libraries (export/import first; cloud later).

## Packaging and distribution
- Developer ID signed (not ad-hoc) and notarized.
- Entitlements include app sandbox and input device access; Automation entitlement only if optional feature exists.
- First run should guide user to move app to `/Applications` if not already there.

## Documentation
- In-app Help: permissions rationale, privacy, known limitations, quick troubleshooting.
- Build/deploy guide for developers covering signing and notarization.
- Validation rules document that matches this spec. 