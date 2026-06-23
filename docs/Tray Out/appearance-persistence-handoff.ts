/**
 * ============================================================
 * APPEARANCE TAB PERSISTENCE HANDOFF — cohere-proofreader
 * Date: 2026-06-23
 * Follows: ui-audit-handoff.ts (UI Co-Designer Handoff)
 * Target repo: arabicroute/saas-proofreading (main)
 * Storage key: "ui-prefs"
 * ============================================================
 *
 * WHAT THIS FILE COVERS
 * ─────────────────────
 * This handoff implements persistence for the Appearance tab
 * introduced in the UI Co-Designer audit handoff. It is scoped
 * exclusively to the `ui` state slice. No proofreading logic,
 * API logic, or feature config is touched.
 *
 * PREREQUISITE
 * ─────────────────────
 * The following files from ui-audit-handoff.ts must already
 * be in place before applying this handoff:
 *
 *   src/types/uiConfig.ts         (UiState, PanelId, etc.)
 *   src/config/uiConfig.ts        (UI_DEFAULTS, SKIN_OPTIONS, etc.)
 *   src/lib/uiSelectors.ts        (CLS, IDS, DATA)
 *   src/components/tabs/UiTab.tsx (Appearance tab component)
 *   src/App.tsx                   (updated shell with Appearance tab)
 *   src/index.css                 (design tokens + component layer)
 *
 * If those files are NOT yet applied, apply ui-audit-handoff.ts
 * first, then apply this file on top.
 *
 * FILES IN THIS HANDOFF
 * ─────────────────────
 * 1. src/config/uiConfig.ts        [CHANGE] — add persistence helpers
 * 2. src/context/AppContext.tsx     [CHANGE] — add UiState slice +
 *                                             persistence effect
 *
 * ROLLOUT ORDER
 * ─────────────────────
 *   Step 1 — Replace src/config/uiConfig.ts
 *   Step 2 — Replace src/context/AppContext.tsx
 *   Step 3 — Verify with the checklist at the bottom of this file
 *
 * ============================================================
 */


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE 1: src/config/uiConfig.ts  [CHANGE]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// WHAT CHANGED FROM THE PRIOR HANDOFF VERSION
// ─────────────────────────────────────────────
// Three persistence helpers are appended below the existing
// SKIN_OPTIONS and DENSITY_OPTIONS exports. Everything above
// the "── Persistence helpers ──" comment is identical to the
// version delivered in ui-audit-handoff.ts.
//
// New exports:
//   loadStoredUiPrefs()          — safe read + merge from localStorage
//   saveUiPrefs(ui)              — safe write to localStorage
//   mergeStoredUiWithDefaults()  — merge helper (also exported for tests)
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const _uiConfigTs = `
// src/config/uiConfig.ts
// ─────────────────────────────────────────────────────────────────
// Default values, display metadata, and persistence helpers for
// the UI appearance state slice.
// ─────────────────────────────────────────────────────────────────

import type { UiState } from "../types/uiConfig";

// ── Factory defaults ──────────────────────────────────────────────
// Single source of truth for what "factory reset" looks like.
// loadStoredUiPrefs() and RESET_UI both refer back to this object.
export const UI_DEFAULTS: UiState = {
  skin: "default",
  density: "default",
  dir: {
    global: "ltr",
    pageOverride: {
      // Arabic text panels default to RTL at the tab level so
      // individual textareas do not need their own dir="rtl".
      input: "rtl",
      output: "inherit",
    },
  },
  panels: {
    "panel-api-key":           { hidden: false, label: "API Key",              tab: "config" },
    "panel-connection":        { hidden: false, label: "Connection Test",       tab: "config" },
    "panel-tier":              { hidden: false, label: "Plan Tier",             tab: "config" },
    "panel-model":             { hidden: false, label: "Model",                 tab: "config" },
    "panel-inference":         { hidden: false, label: "Inference Parameters",  tab: "config" },
    "panel-multiturn":         { hidden: false, label: "Multi-Turn Chunking",   tab: "config" },
    "panel-instructions":      { hidden: false, label: "Custom Instructions",   tab: "config" },
    "panel-usage":             { hidden: false, label: "Usage Monitor",         tab: "config" },
    "panel-debug-connection":  { hidden: true,  label: "Connection Debug Log",  tab: "config" },
    "panel-stats":             { hidden: false, label: "Stats Bar",             tab: "output" },
    "panel-clean-results":     { hidden: false, label: "Clean Results",         tab: "output" },
    "panel-flagged-results":   { hidden: false, label: "Flagged Results",       tab: "output" },
  },
};

// ── Skin display metadata ─────────────────────────────────────────
export const SKIN_OPTIONS: Array<{
  id: UiState["skin"];
  label: string;
  description: string;
  swatchBg: string;
  swatchText: string;
}> = [
  {
    id: "default",
    label: "Default",
    description: "Navy on white — the original palette",
    swatchBg: "bg-[#1c2b4a]",
    swatchText: "text-white",
  },
  {
    id: "warm",
    label: "Warm",
    description: "Slate-brown — easier on the eyes in bright rooms",
    swatchBg: "bg-[#4a3828]",
    swatchText: "text-white",
  },
  {
    id: "high-contrast",
    label: "High Contrast",
    description: "Pure black on white — WCAG AA for all text sizes",
    swatchBg: "bg-black",
    swatchText: "text-white",
  },
];

// ── Density display metadata ──────────────────────────────────────
export const DENSITY_OPTIONS: Array<{
  id: UiState["density"];
  label: string;
  description: string;
}> = [
  { id: "default", label: "Default", description: "Standard card padding (p-5)" },
  { id: "compact", label: "Compact", description: "Reduced card padding (p-3), smaller labels" },
];

// ── Persistence helpers ───────────────────────────────────────────
// These are the only three functions that touch localStorage.
// All other code reads/writes UiState through AppContext only.

const STORAGE_KEY = "ui-prefs";

/**
 * mergeStoredUiWithDefaults
 * ─────────────────────────
 * Takes an unknown value (raw parsed JSON or anything) and returns
 * a fully valid UiState by merging it over UI_DEFAULTS.
 *
 * Merge strategy:
 *   - Top-level scalar fields (skin, density): stored value wins if
 *     it is a valid string and matches the known union members;
 *     otherwise the default wins.
 *   - dir.global: same scalar validation.
 *   - dir.pageOverride: spread-merged — stored keys win, missing
 *     keys fall back to UI_DEFAULTS.dir.pageOverride.
 *   - panels: merged by panel ID — for each known panel, the stored
 *     panel's "hidden" value is used if present and boolean;
 *     the default panel's label and tab metadata are always kept
 *     from UI_DEFAULTS so newly renamed labels pick up automatically.
 *     Unknown panel IDs in storage are ignored (forward-compat).
 *
 * This function is exported so it can be unit-tested independently.
 */
export function mergeStoredUiWithDefaults(stored: unknown): UiState {
  // If stored is not an object at all, return defaults immediately.
  if (typeof stored !== "object" || stored === null || Array.isArray(stored)) {
    return UI_DEFAULTS;
  }

  const s = stored as Record<string, unknown>;

  // ── skin ──────────────────────────────────────────────────────
  const VALID_SKINS: UiState["skin"][] = ["default", "warm", "high-contrast"];
  const skin: UiState["skin"] =
    typeof s.skin === "string" && VALID_SKINS.includes(s.skin as UiState["skin"])
      ? (s.skin as UiState["skin"])
      : UI_DEFAULTS.skin;

  // ── density ───────────────────────────────────────────────────
  const VALID_DENSITIES: UiState["density"][] = ["default", "compact"];
  const density: UiState["density"] =
    typeof s.density === "string" && VALID_DENSITIES.includes(s.density as UiState["density"])
      ? (s.density as UiState["density"])
      : UI_DEFAULTS.density;

  // ── dir ───────────────────────────────────────────────────────
  const VALID_DIRS = ["ltr", "rtl"];
  const storedDir = typeof s.dir === "object" && s.dir !== null
    ? (s.dir as Record<string, unknown>)
    : {};

  const globalDir: UiState["dir"]["global"] =
    typeof storedDir.global === "string" && VALID_DIRS.includes(storedDir.global)
      ? (storedDir.global as UiState["dir"]["global"])
      : UI_DEFAULTS.dir.global;

  // pageOverride: merge stored keys over defaults, validating each value
  const VALID_OVERRIDES = ["ltr", "rtl", "inherit"];
  const storedPageOverride =
    typeof storedDir.pageOverride === "object" &&
    storedDir.pageOverride !== null &&
    !Array.isArray(storedDir.pageOverride)
      ? (storedDir.pageOverride as Record<string, unknown>)
      : {};

  const pageOverride: UiState["dir"]["pageOverride"] = {
    ...UI_DEFAULTS.dir.pageOverride,
  };
  for (const [tab, val] of Object.entries(storedPageOverride)) {
    if (typeof val === "string" && VALID_OVERRIDES.includes(val)) {
      (pageOverride as Record<string, string>)[tab] =
        val as "ltr" | "rtl" | "inherit";
    }
  }

  // ── panels ────────────────────────────────────────────────────
  // For each panel defined in UI_DEFAULTS:
  //   - Keep the default's label and tab (structural metadata).
  //   - Override hidden if and only if the stored value is a boolean.
  // Stored panel IDs not in UI_DEFAULTS are silently ignored.
  const storedPanels =
    typeof s.panels === "object" && s.panels !== null && !Array.isArray(s.panels)
      ? (s.panels as Record<string, unknown>)
      : {};

  const panels = { ...UI_DEFAULTS.panels } as UiState["panels"];

  for (const panelId of Object.keys(UI_DEFAULTS.panels) as Array<keyof typeof UI_DEFAULTS.panels>) {
    const storedPanel = storedPanels[panelId];
    if (
      typeof storedPanel === "object" &&
      storedPanel !== null &&
      typeof (storedPanel as Record<string, unknown>).hidden === "boolean"
    ) {
      panels[panelId] = {
        ...UI_DEFAULTS.panels[panelId],  // always keep label + tab from defaults
        hidden: (storedPanel as { hidden: boolean }).hidden,
      };
    }
  }

  return {
    skin,
    density,
    dir: { global: globalDir, pageOverride },
    panels,
  };
}

/**
 * loadStoredUiPrefs
 * ─────────────────
 * Reads "ui-prefs" from localStorage and returns a safe, merged
 * UiState. Falls back to UI_DEFAULTS on any failure:
 *   - localStorage unavailable (SSR, private mode, security policy)
 *   - key missing
 *   - JSON parse error
 *   - stored value fails validation
 *
 * Never throws. Safe to call during module initialisation.
 */
export function loadStoredUiPrefs(): UiState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return UI_DEFAULTS;
    const parsed: unknown = JSON.parse(raw);
    return mergeStoredUiWithDefaults(parsed);
  } catch {
    // JSON.parse failure, localStorage access error, or SecurityError
    return UI_DEFAULTS;
  }
}

/**
 * saveUiPrefs
 * ───────────
 * Serialises the given UiState and writes it to localStorage.
 * Only the fields that need to survive a reload are written
 * (skin, density, dir, panels[*].hidden — labels and tab metadata
 * are intentionally omitted because they come from UI_DEFAULTS on
 * load and will be re-merged there).
 *
 * Never throws. Write failures are silently ignored so that a
 * storage quota error or private-mode restriction does not crash
 * the app.
 */
export function saveUiPrefs(ui: UiState): void {
  try {
    // Build a narrow payload — only serialisable preference values.
    // Label and tab metadata are structural defaults, not preferences.
    const payload = {
      skin: ui.skin,
      density: ui.density,
      dir: {
        global: ui.dir.global,
        pageOverride: ui.dir.pageOverride,
      },
      panels: Object.fromEntries(
        Object.entries(ui.panels).map(([id, panel]) => [
          id,
          { hidden: panel.hidden },
          // label and tab deliberately omitted — re-hydrated from UI_DEFAULTS on load
        ]),
      ),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota exceeded, SecurityError in private mode, or serialisation
    // error — all silently ignored.
  }
}
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE 2: src/context/AppContext.tsx  [CHANGE — complete replacement]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// WHAT THIS DELIVERS
// ─────────────────────────────────────────────────────────────────
// This is the single file that combines:
//   (a) the UiState slice from the prior audit handoff
//   (b) the persistence layer from this handoff
//
// It replaces the current 100-line pre-handoff AppContext.tsx in
// the repo. Apply it as a full file replacement.
//
// KEY DECISIONS (per the brief)
// ─────────────────────────────────────────────────────────────────
// 1. REDUCER STAYS PURE
//    The reducer has no localStorage calls. It only transforms state.
//    This keeps it testable and free of side effects.
//
// 2. PERSISTENCE VIA useEffect IN AppProvider
//    A single useEffect watches state.ui and writes to localStorage
//    whenever it changes. This is the cleanest pattern:
//      - One write path, no duplication across reducer branches
//      - No risk of forgetting to persist a new action type
//      - Easy to migrate to a different storage backend later
//      - Effect only fires when ui actually changes (reference equality)
//
// 3. INITIAL STATE LOADS FROM STORAGE
//    initialState.ui is set by loadStoredUiPrefs() at module load
//    time (before first render). This means saved preferences are
//    applied before the first paint — no flash of default styles.
//
// 4. RESET_UI ALSO CLEARS STORAGE
//    When the reducer handles RESET_UI, it returns UI_DEFAULTS.
//    The useEffect then sees the new ui value and writes UI_DEFAULTS
//    to localStorage. No special case needed in the effect.
//
// 5. NARROW ui DEPENDENCY IN useEffect
//    The effect depends on state.ui (the object reference). The
//    reducer always returns a new object reference for ui after any
//    UI action, so the effect fires exactly when needed and never
//    for non-UI actions (SET_CFG, SESSION_START, etc.).
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const _appContextTs = `
// src/context/AppContext.tsx
import React, { createContext, useContext, useReducer, useEffect, type Dispatch } from "react";

import type { FeatureConfig }  from "../types/featureConfig";
import type { MergedResult }   from "../types/recommendation";
import type { ChunkProgress }  from "../lib/proofreadingSession";
import { TESTING_DEFAULTS }    from "../config/featureConfig";

import type { UiState, PanelId, UiDirOverride } from "../types/uiConfig";
import { UI_DEFAULTS, loadStoredUiPrefs, saveUiPrefs } from "../config/uiConfig";

// ── Tab type ──────────────────────────────────────────────────────
export type AppTab = "config" | "input" | "output" | "playground";

// ── App state shape ───────────────────────────────────────────────
export interface AppState {
  // credentials
  apiKey: string;
  // feature config (proofreading behaviour)
  cfg: FeatureConfig;
  // input
  inputText: string;
  inputFileName: string;
  // session
  running: boolean;
  progress: ChunkProgress[];
  result: MergedResult | null;
  sessionError: string;
  // navigation
  activeTab: AppTab;
  // dev: in-memory prompt override (Playground tab)
  promptOverride: string | undefined;
  // appearance (persisted to localStorage under "ui-prefs")
  ui: UiState;
}

// ── Action union ──────────────────────────────────────────────────
export type AppAction =
  // existing actions — unchanged
  | { type: "SET_API_KEY";        key: string }
  | { type: "SET_CFG";            cfg: Partial<FeatureConfig> }
  | { type: "SET_INPUT";          text: string; fileName?: string }
  | { type: "SESSION_START" }
  | { type: "SESSION_PROGRESS";   progress: ChunkProgress }
  | { type: "SESSION_DONE";       result: MergedResult }
  | { type: "SESSION_ERROR";      message: string }
  | { type: "SET_TAB";            tab: AppTab }
  | { type: "SET_PROMPT_OVERRIDE"; prompt: string | undefined }
  // appearance actions (new)
  | { type: "SET_UI_SKIN";         skin: UiState["skin"] }
  | { type: "SET_UI_DENSITY";      density: UiState["density"] }
  | { type: "SET_UI_DIR";          dir: UiState["dir"]["global"] }
  | { type: "SET_UI_DIR_OVERRIDE"; tab: AppTab; dir: UiDirOverride }
  | { type: "SET_PANEL_HIDDEN";    panelId: PanelId; hidden: boolean }
  | { type: "RESET_UI" };

// ── Reducer — pure, no side effects ──────────────────────────────
function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {

    // ── Existing actions ────────────────────────────────────────
    case "SET_API_KEY":
      return { ...state, apiKey: action.key };

    case "SET_CFG":
      return { ...state, cfg: { ...state.cfg, ...action.cfg } };

    case "SET_INPUT":
      return {
        ...state,
        inputText: action.text,
        inputFileName: action.fileName ?? "",
      };

    case "SESSION_START":
      return { ...state, running: true, progress: [], result: null, sessionError: "" };

    case "SESSION_PROGRESS": {
      const updated = [...state.progress];
      updated[action.progress.index] = action.progress;
      return { ...state, progress: updated };
    }

    case "SESSION_DONE":
      return { ...state, running: false, result: action.result };

    case "SESSION_ERROR":
      return { ...state, running: false, sessionError: action.message };

    case "SET_TAB":
      return { ...state, activeTab: action.tab };

    case "SET_PROMPT_OVERRIDE":
      return { ...state, promptOverride: action.prompt };

    // ── Appearance actions ──────────────────────────────────────
    // Each returns a new state object with a new ui reference.
    // The AppProvider effect detects the new reference and persists.

    case "SET_UI_SKIN":
      return {
        ...state,
        ui: { ...state.ui, skin: action.skin },
      };

    case "SET_UI_DENSITY":
      return {
        ...state,
        ui: { ...state.ui, density: action.density },
      };

    case "SET_UI_DIR":
      return {
        ...state,
        ui: {
          ...state.ui,
          dir: { ...state.ui.dir, global: action.dir },
        },
      };

    case "SET_UI_DIR_OVERRIDE":
      return {
        ...state,
        ui: {
          ...state.ui,
          dir: {
            ...state.ui.dir,
            pageOverride: {
              ...state.ui.dir.pageOverride,
              [action.tab]: action.dir,
            },
          },
        },
      };

    case "SET_PANEL_HIDDEN":
      return {
        ...state,
        ui: {
          ...state.ui,
          panels: {
            ...state.ui.panels,
            [action.panelId]: {
              ...state.ui.panels[action.panelId],
              hidden: action.hidden,
            },
          },
        },
      };

    case "RESET_UI":
      // Returning UI_DEFAULTS triggers the persistence effect, which
      // writes UI_DEFAULTS to localStorage — no special case needed.
      return { ...state, ui: UI_DEFAULTS };

    default:
      return state;
  }
}

// ── Initial state ─────────────────────────────────────────────────
// ui is populated from localStorage at module load time (synchronous,
// before first render) so saved preferences apply before the first paint.
// loadStoredUiPrefs() never throws and always returns a valid UiState.
const initialState: AppState = {
  apiKey:        import.meta.env.VITE_COHERE_API_KEY ?? "",
  cfg:           TESTING_DEFAULTS,
  inputText:     "",
  inputFileName: "",
  running:       false,
  progress:      [],
  result:        null,
  sessionError:  "",
  activeTab:     "config",
  promptOverride: undefined,
  ui:            loadStoredUiPrefs(),   // ← replaces UI_DEFAULTS directly
};

// ── Context objects ───────────────────────────────────────────────
const StateCtx    = createContext<AppState>(initialState);
const DispatchCtx = createContext<Dispatch<AppAction>>(() => undefined);

// ── Provider ──────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Persistence effect — fires whenever state.ui changes.
  //
  // Dependency: state.ui (object reference).
  // The reducer returns a new ui object reference for every UI action,
  // so this fires exactly once per UI change and never for non-UI
  // actions (SET_CFG, SESSION_START, etc.) which leave state.ui
  // reference-identical.
  //
  // saveUiPrefs() never throws — quota and permission errors are
  // silently swallowed inside the helper.
  useEffect(() => {
    saveUiPrefs(state.ui);
  }, [state.ui]);

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        {children}
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────
export const useAppState    = () => useContext(StateCtx);
export const useAppDispatch = () => useContext(DispatchCtx);
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DESIGN NOTES — for the record
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const _designNotes = `
/*
════════════════════════════════════════════════════════════════
DESIGN NOTES
════════════════════════════════════════════════════════════════

── Why useEffect and not a wrapping reducer? ───────────────────

Two implementation patterns were considered per the brief:
  (A) Wrap the reducer — call saveUiPrefs() inside each UI case.
  (B) useEffect in AppProvider watching state.ui.

Pattern A was rejected for two reasons:
  1. It requires touching every UI reducer case individually.
     If a new UI action is added later and the developer forgets
     to add saveUiPrefs(), that action silently loses persistence.
  2. It pollutes the reducer with a side effect, making unit tests
     of the reducer require localStorage mocking.

Pattern B is used here. The effect has one dependency (state.ui),
fires automatically for every UI state change regardless of which
action caused it, and keeps the reducer a pure function.

── Why is initialState populated synchronously? ─────────────────

loadStoredUiPrefs() is called once, synchronously, when the module
is first evaluated (before the component tree mounts). This means
the correct skin, density, and dir values are in state before the
first render and before any useEffect fires. There is no flash of
default styles before the saved skin is applied.

The alternative — reading storage in a useEffect after mount — would
cause a visible flash: the shell renders with the default skin, then
jumps to the saved skin on the first effect tick. That UX artifact
is avoided by the synchronous initialState pattern.

── Why is the payload in saveUiPrefs() narrow? ──────────────────

The full UiState panels object includes label and tab fields:
  { hidden: false, label: "API Key", tab: "config" }

Only "hidden" is a user preference. "label" and "tab" are
structural metadata derived from UI_DEFAULTS. Persisting them
would mean:
  - Future label renames in UI_DEFAULTS would not propagate to
    users who already have the key in storage.
  - Storage payload is unnecessarily large.

The mergeStoredUiWithDefaults() merge strategy always takes
label and tab from UI_DEFAULTS and only takes hidden from storage,
so the narrow write is safe.

── Why is mergeStoredUiWithDefaults() exported? ─────────────────

Exporting it allows the function to be unit-tested in isolation
without needing to mock localStorage or mount a React provider.
Test cases can pass arbitrary objects (null, malformed JSON output,
partial objects, objects with extra keys) and assert the output
is always a valid UiState.

── What happens if a new PanelId is added to UI_DEFAULTS later? ──

The merge loop:
  for (const panelId of Object.keys(UI_DEFAULTS.panels)) { ... }

iterates over UI_DEFAULTS, not over stored data. A new panel in
UI_DEFAULTS that does not exist in the stored payload will simply
use its UI_DEFAULTS value (hidden: false, or whatever the new
default is). The stored payload is not written for that key yet,
so on the next save (triggered by any UI action), the full panel
set including the new panel will be written.

── What happens if a PanelId is removed from UI_DEFAULTS later? ──

The merge loop ignores stored keys that are not in UI_DEFAULTS
(they are never iterated). The stale key sits unused in localStorage
until the next full save overwrites it. No orphaned panel keys can
affect the live UI.

── RESET_UI and storage ─────────────────────────────────────────

When the user clicks "Reset appearance to defaults" in UiTab:
  1. RESET_UI action dispatched.
  2. Reducer returns { ...state, ui: UI_DEFAULTS }.
  3. state.ui reference changes (new object).
  4. useEffect fires with the new ui === UI_DEFAULTS.
  5. saveUiPrefs(UI_DEFAULTS) writes defaults to "ui-prefs".
  6. On the next reload, loadStoredUiPrefs() reads "ui-prefs",
     merges UI_DEFAULTS over UI_DEFAULTS, returns UI_DEFAULTS.
     The reset persists correctly.

No special case is needed in the effect or in saveUiPrefs.
*/
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VERIFICATION CHECKLIST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const _verificationChecklist = `
/*
════════════════════════════════════════════════════════════════
VERIFICATION CHECKLIST
(All items from the brief, mapped to what to check in browser)
════════════════════════════════════════════════════════════════

Open the app in DEV mode. Open DevTools → Application → Local Storage.

── Functional checks ───────────────────────────────────────────

□ Change skin to "Warm".
  → App immediately shows brown brand color.
  → localStorage["ui-prefs"] contains { "skin": "warm", ... }.
  → Hard-refresh (Cmd+Shift+R). App loads with brown brand color.
  → localStorage["ui-prefs"] still contains skin: "warm".

□ Change density to "Compact".
  → Cards visibly reduce padding.
  → Hard-refresh. Compact density is still active.

□ Change global direction to "RTL".
  → Shell content flips direction.
  → Hard-refresh. RTL direction is still active.

□ Change per-tab direction override for "Config" to "LTR".
  → Config tab renders LTR while other tabs follow global dir.
  → Hard-refresh. Override is still in effect.

□ Hide "Usage Monitor" panel.
  → Usage Monitor card disappears in Config tab.
  → Hard-refresh. Usage Monitor card is still hidden.

□ Click "↺ Reset appearance to defaults".
  → Skin returns to navy, density to default, direction to LTR.
  → Hidden panels reappear.
  → localStorage["ui-prefs"] now contains default values.
  → Hard-refresh. Defaults are still in effect (reset persisted).

── Edge case / resilience checks ───────────────────────────────

□ Open DevTools → Application → Local Storage.
  → Delete the "ui-prefs" key manually.
  → Hard-refresh. App loads with UI_DEFAULTS (navy, default, LTR).
  → No console error.

□ In DevTools console, run:
    localStorage.setItem("ui-prefs", "not valid json{{{{")
  → Hard-refresh.
  → App loads with UI_DEFAULTS.
  → No crash, no console error from the app itself
    (JSON.parse throws internally and is caught).

□ In DevTools console, run:
    localStorage.setItem("ui-prefs", JSON.stringify({ skin: "purple" }))
  → Hard-refresh.
  → "purple" is not a valid skin value; app loads with skin: "default".
  → All other fields also fall back to defaults since the payload
    has no other keys.

□ In DevTools console, run:
    localStorage.setItem("ui-prefs", JSON.stringify({
      skin: "warm",
      panels: { "panel-api-key": { hidden: true } }
    }))
  → Hard-refresh.
  → Skin is warm, API Key panel is hidden.
  → All other panels are visible (they fell back to UI_DEFAULTS).
  → Panel labels ("API Key", "Usage Monitor", etc.) are correct
    — they come from UI_DEFAULTS, not storage.

── Build check ─────────────────────────────────────────────────

□ npm run build  → exits 0, no TypeScript errors.

── Regression checks ───────────────────────────────────────────

□ Config tab: all controls function (toggles, sliders, selects).
□ Input tab: text entry, file upload, Start Proofreading work.
□ Output tab: results display if a session was run.
□ Playground tab (dev-only): renders without errors.
□ Appearance tab: skin/density/direction/panels all respond to changes.
□ Non-UI actions (SET_CFG, SESSION_START, etc.) do not write to
  localStorage (verify by watching Network or Storage events — only
  UI actions should trigger a storage write).
*/
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// END OF HANDOFF
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// FILES CHANGED: 2
//   src/config/uiConfig.ts      — added loadStoredUiPrefs(),
//                                 saveUiPrefs(), mergeStoredUiWithDefaults()
//   src/context/AppContext.tsx  — added UiState slice, 6 UI actions,
//                                 loadStoredUiPrefs() initialState,
//                                 persistence useEffect
//
// FILES UNCHANGED (no touch required by this handoff):
//   src/types/uiConfig.ts
//   src/lib/uiSelectors.ts
//   src/components/tabs/UiTab.tsx
//   src/App.tsx
//   src/index.css
//   tailwind.config.ts
//   All proofreading / API / feature config files
