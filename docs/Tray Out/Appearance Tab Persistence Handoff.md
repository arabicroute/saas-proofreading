# Appearance Tab Persistence Handoff

## Affected Files

GitHub paths for the co-programmer:

- `https://github.com/arabicroute/saas-proofreading/tree/main/src/context/AppContext.tsx`
- `https://github.com/arabicroute/saas-proofreading/tree/main/src/config/uiConfig.ts`
- `https://github.com/arabicroute/saas-proofreading/tree/main/src/types/uiConfig.ts`
- `https://github.com/arabicroute/saas-proofreading/tree/main/src/components/tabs/UiTab.tsx`
- `https://github.com/arabicroute/saas-proofreading/tree/main/src/App.tsx`
- `https://github.com/arabicroute/saas-proofreading/tree/main/src/index.css`
- `https://github.com/arabicroute/saas-proofreading/tree/main/docs/Tray%20Out/Appearance%20Tab%20Persistence%20Handoff.md`

## Objective

Implement persistence for the new Appearance tab so that user-selected appearance preferences are saved and automatically re-applied when the app reloads.

The intended user-visible result is:

- A user changes appearance settings in the dev-only Appearance tab.
- The selected settings remain active after a browser refresh or reopening the app.
- The saved settings are applied immediately on app start, before the user interacts again.
- The existing dev-only visibility plan for the Appearance tab remains unchanged.

## Current State

The Appearance tab UI is already implemented and wired into app state.

Current files already in place:

- `src/components/tabs/UiTab.tsx`
- `src/context/AppContext.tsx`
- `src/config/uiConfig.ts`
- `src/types/uiConfig.ts`
- `src/App.tsx`
- `src/index.css`

Current behavior:

- Appearance settings are stored only in memory under `state.ui`.
- `App.tsx` already applies `ui.skin` and `ui.density` to the shell via data attributes.
- `App.tsx` already resolves effective page direction from `ui.dir`.
- Panel visibility already reads from `ui.panels`.
- Reset already restores `UI_DEFAULTS`, but only for the current session.

## Requested Outcome

Persist the `ui` slice of state to browser storage and restore it on load.

Persist these Appearance tab settings:

- `skin`
- `density`
- `dir.global`
- `dir.pageOverride`
- `panels[*].hidden`

Do not change:

- The dev-only gate for the Appearance tab
- Proofreading logic
- API/proxy logic
- Feature config behavior

## Recommended Implementation Path

Use `localStorage` persistence for the `ui` slice only.

Use a single storage key:

- `ui-prefs`

This aligns with the future roadmap notes already included in the inbound UI audit handoff.

## Implementation Notes

### 1. Restore persisted UI state during app initialization

Update `src/context/AppContext.tsx` so the initial `ui` state is derived from saved preferences when available.

Recommended pattern:

- Read `localStorage.getItem("ui-prefs")`
- Parse the saved JSON safely
- Merge it over `UI_DEFAULTS`
- Fall back to `UI_DEFAULTS` if parsing fails or storage is unavailable

Important:

- Do not assume storage contents are valid
- Protect against malformed JSON
- Preserve defaults for any newly added fields not present in older saved payloads

### 2. Persist the UI slice after UI actions

Persist only after appearance-related actions:

- `SET_UI_SKIN`
- `SET_UI_DENSITY`
- `SET_UI_DIR`
- `SET_UI_DIR_OVERRIDE`
- `SET_PANEL_HIDDEN`
- `RESET_UI`

Recommended approaches:

- Wrap the reducer with a persistence layer, or
- Persist inside the provider using an effect that watches `state.ui`

Preferred approach:

- Use a `useEffect` in `AppProvider` that writes `state.ui` to `localStorage`

Reason:

- Keeps reducer pure
- Avoids duplicated storage logic in multiple reducer branches
- Makes future storage migration easier

### 3. Keep payload shape narrow

Persist only serializable preference values.

Do not persist:

- Derived values
- JSX-facing selector constants
- Anything outside `state.ui`

### 4. Merge persisted values with defaults

Do not replace `UI_DEFAULTS` wholesale with stored JSON.

The restored result should behave like:

- top-level defaults remain available
- missing nested fields fall back cleanly
- future new panels or settings automatically get default values

Special attention:

- `panels` should merge by panel id so any newly added panel keeps its default label/tab metadata and only `hidden` is overridden where appropriate
- `dir.pageOverride` should merge rather than replace blindly

### 5. Keep Reset behavior intuitive

When the user clicks “Reset appearance to defaults”:

- UI state should revert immediately to `UI_DEFAULTS`
- persisted storage should update too
- on the next reload, defaults should still be in effect

## Suggested File Touches

### Required

- `src/context/AppContext.tsx`

### Possibly helpful

- `src/config/uiConfig.ts`

Only if you want a helper such as:

- `mergeUiStateWithDefaults()`
- `sanitizeStoredUiState()`

## Suggested Technical Shape

Recommended helper functions:

- `loadStoredUiPrefs(): UiState`
- `saveUiPrefs(ui: UiState): void`
- `mergeStoredUiWithDefaults(stored: unknown): UiState`

Recommended guardrails:

- Wrap storage reads in `try/catch`
- Wrap storage writes in `try/catch`
- If parsing fails, ignore storage and continue with defaults
- Avoid throwing during render or provider initialization

## Behavior Requirements

The co-programmer should verify all of the following:

- Changing skin updates the app immediately and survives refresh
- Changing density survives refresh
- Changing global direction survives refresh
- Changing per-tab direction overrides survives refresh
- Hiding/showing panels survives refresh
- Resetting appearance restores defaults and survives refresh
- If `localStorage` is empty, the app uses `UI_DEFAULTS`
- If `localStorage` contains invalid JSON, the app still loads normally
- If new UI fields are added later, older saved data does not break the app

## Acceptance Criteria

The task is complete when:

- The app loads with saved appearance preferences already applied
- A browser refresh preserves appearance settings
- `RESET_UI` also resets the saved settings
- No regression is introduced in existing config/input/output/playground behavior
- `npm run build` passes

## Non-Goals

Do not implement these in this task:

- Server-side persistence
- Multi-user profiles
- Export/import of themes
- URL-based theme sharing
- Dark mode
- New Appearance tab controls
- Production exposure of the Appearance tab

## Reference Note

The inbound UI audit already documented the persistence direction in:

- `docs/Tray IN/UI Audit/ui-audit-handoff.ts`

Relevant note:

- `UiState is currently in-memory`
- recommended storage key: `ui-prefs`
- recommended persistence target: the `ui` slice only

## Handoff Summary

Please implement persistence for the existing Appearance tab using browser `localStorage`, scoped only to the `ui` state slice, with safe load/merge behavior and no change to the dev-only visibility plan.
