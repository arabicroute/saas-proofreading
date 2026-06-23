/**
 * ============================================================
 * MULTI API KEY SELECTOR HANDOFF — cohere-proofreader
 * Date: 2026-06-23
 * Follows: appearance-persistence-handoff.ts
 * Target repo: arabicroute/saas-proofreading (main)
 * ============================================================
 *
 * WHAT THIS HANDOFF DELIVERS
 * ──────────────────────────
 * 1. Replaces the free-text API key password input in ConfigTab
 *    with a labeled dropdown built from VITE_COHERE_API_KEY_1..10
 *    and VITE_COHERE_API_KEY_LABEL_1..10 env pairs.
 *
 * 2. Auto-selects the slot configured in APP_CONFIG.defaultKeySlot
 *    on every cold load (no persistence — session-scoped only).
 *
 * 3. Renames the existing "Config" tab to "AI Config" to separate
 *    Cohere AI settings from the new "App Config" tab scope.
 *
 * 4. Adds a new "App Config" tab (last in strip) that owns:
 *    - Default API key slot selector
 *    - Locale / language stub (future hook, not wired)
 *
 * TAB STRIP ORDER (final)
 * ──────────────────────────
 *   ⚙ AI Config  |  ✏ Input  |  📄 Output  |
 *   🛠 Playground (dev)  |  🎨 Appearance (dev)  |  🔧 App Config
 *
 * FILES IN THIS HANDOFF
 * ──────────────────────────
 *   NEW   src/types/appConfig.ts
 *   NEW   src/config/appConfig.ts
 *   NEW   src/lib/apiKeys.ts
 *   NEW   src/components/tabs/AppConfigTab.tsx
 *   CHANGE src/context/AppContext.tsx
 *   CHANGE src/components/tabs/ConfigTab.tsx
 *   CHANGE src/App.tsx
 *
 * ROLLOUT ORDER
 * ──────────────────────────
 *   Step 1 — Create src/types/appConfig.ts
 *   Step 2 — Create src/config/appConfig.ts
 *   Step 3 — Create src/lib/apiKeys.ts
 *   Step 4 — Replace src/context/AppContext.tsx
 *   Step 5 — Replace src/components/tabs/ConfigTab.tsx
 *   Step 6 — Create src/components/tabs/AppConfigTab.tsx
 *   Step 7 — Replace src/App.tsx
 *   Step 8 — Verify with checklist at bottom of this file
 *
 * DOWNSTREAM FILES — NO TOUCH REQUIRED
 * ──────────────────────────────────────
 *   ConnectionPanel.tsx   — reads state.apiKey, unchanged
 *   InputTab.tsx          — reads state.apiKey, unchanged
 *   PlaygroundTab.tsx     — reads state.apiKey, unchanged
 *   cohereClient.ts       — receives apiKey as argument, unchanged
 *   proofreadingSession.ts — receives apiKey as argument, unchanged
 *
 * ============================================================
 */


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE 1: src/types/appConfig.ts  [NEW]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// AppConfig holds app-wide defaults that live in App Config tab.
// Kept intentionally small at launch — only defaultKeySlot is
// wired. The locale stub is an explicit future hook documented in
// the type so the architecture slot exists without dead UI.
//
export const _appConfigTypes = `
// src/types/appConfig.ts
// ─────────────────────────────────────────────────────────────────
// App-wide configuration type.
// Separate from FeatureConfig (AI settings) and UiState (appearance).
// ─────────────────────────────────────────────────────────────────

// Key slot numbers: 1 through 10.
export type KeySlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface AppConfig {
  /**
   * The API key slot to auto-select on cold load.
   * Value comes from VITE_APP_DEFAULT_KEY_SLOT env var (default: 1).
   * The user can override this session-only from the AI Config tab
   * dropdown — the override is not persisted.
   */
  defaultKeySlot: KeySlot;

  /**
   * Future hook: locale / language code for i18n.
   * Not wired at launch. Documented here so the AppConfig tab
   * can expose it when the i18n layer is ready without a type refactor.
   * @future
   */
  locale?: string;
}
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE 2: src/config/appConfig.ts  [NEW]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Reads app-wide config from env. Validated and normalised here
// once; all consumers import APP_CONFIG and read typed values.
//
export const _appConfigTs = `
// src/config/appConfig.ts
// ─────────────────────────────────────────────────────────────────
// App-wide configuration, read from env at module load time.
//
// Env vars consumed here:
//   VITE_APP_DEFAULT_KEY_SLOT  — integer 1..10, default 1
//
// ─────────────────────────────────────────────────────────────────

import type { AppConfig, KeySlot } from "../types/appConfig";

// Parse and clamp VITE_APP_DEFAULT_KEY_SLOT to a valid KeySlot.
function parseDefaultKeySlot(): KeySlot {
  const raw = import.meta.env.VITE_APP_DEFAULT_KEY_SLOT;
  const n = parseInt(raw, 10);
  if (!isNaN(n) && n >= 1 && n <= 10) return n as KeySlot;
  return 1; // safe fallback
}

export const APP_CONFIG: AppConfig = {
  defaultKeySlot: parseDefaultKeySlot(),
};
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE 3: src/lib/apiKeys.ts  [NEW]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Reads up to 10 VITE_COHERE_API_KEY_N / VITE_COHERE_API_KEY_LABEL_N
// pairs from import.meta.env and returns only the slots that have
// a non-empty key value. This is the single source of truth for the
// available key options list — both ConfigTab dropdown and
// AppConfigTab defaultSlot picker import from here.
//
export const _apiKeysTs = `
// src/lib/apiKeys.ts
// ─────────────────────────────────────────────────────────────────
// Builds the list of configured API key options from env vars.
//
// Env contract (per handoff brief):
//   Key value : VITE_COHERE_API_KEY_1  .. VITE_COHERE_API_KEY_10
//   Key label : VITE_COHERE_API_KEY_LABEL_1 .. VITE_COHERE_API_KEY_LABEL_10
//
// Rules:
//   - A slot is included only if its key value is non-empty.
//   - If the label var is missing or empty, label falls back to "Key {n}".
//   - The legacy single-key VITE_COHERE_API_KEY is NOT included here —
//     it is handled separately in AppContext.initialState as a fallback
//     for setups that have not yet migrated to the numbered slots.
// ─────────────────────────────────────────────────────────────────

import type { KeySlot } from "../types/appConfig";

export interface KeyOption {
  slot:  KeySlot;   // 1..10 — identifies the env pair
  label: string;    // display name shown in the dropdown
  value: string;    // actual API key — never rendered, only dispatched
}

// Evaluated once at module load. Referentially stable — safe to
// use in useMemo([]) or as a module-level constant.
export const KEY_OPTIONS: KeyOption[] = (() => {
  const opts: KeyOption[] = [];
  for (let n = 1; n <= 10; n++) {
    const value = (import.meta.env[\`VITE_COHERE_API_KEY_\${n}\`] as string | undefined) ?? "";
    if (!value.trim()) continue; // slot not configured — skip

    const envLabel = (import.meta.env[\`VITE_COHERE_API_KEY_LABEL_\${n}\`] as string | undefined) ?? "";
    const label = envLabel.trim() || \`Key \${n}\`;

    opts.push({ slot: n as KeySlot, label, value });
  }
  return opts;
})();

/**
 * getKeyBySlot
 * ─────────────
 * Returns the KeyOption for a given slot, or undefined if that
 * slot is not configured. Used by AppContext to resolve the
 * auto-selected key value at initialisation.
 */
export function getKeyBySlot(slot: KeySlot): KeyOption | undefined {
  return KEY_OPTIONS.find(k => k.slot === slot);
}

/**
 * resolveInitialApiKey
 * ─────────────────────
 * Resolves the API key value to use on cold load.
 *
 * Priority order:
 *   1. The slot configured in APP_CONFIG.defaultKeySlot, if present
 *      in KEY_OPTIONS (i.e. that env key value is non-empty).
 *   2. The first available slot in KEY_OPTIONS (if defaultKeySlot
 *      is not configured or its key value is missing).
 *   3. The legacy VITE_COHERE_API_KEY single-key var, if any of
 *      the above yield nothing (backward compatibility).
 *   4. Empty string — server-side proxy key is expected.
 */
export function resolveInitialApiKey(defaultSlot: KeySlot): string {
  // Try the configured default slot first
  const preferred = getKeyBySlot(defaultSlot);
  if (preferred) return preferred.value;

  // Fall back to first available slot
  if (KEY_OPTIONS.length > 0) return KEY_OPTIONS[0].value;

  // Fall back to legacy single-key env var
  const legacy = (import.meta.env.VITE_COHERE_API_KEY as string | undefined) ?? "";
  return legacy;
}

/**
 * resolveInitialSlot
 * ───────────────────
 * Returns the slot number that resolveInitialApiKey() selected,
 * or null if no client-side keys are configured.
 * Used by ConfigTab to set the dropdown's initial value.
 */
export function resolveInitialSlot(defaultSlot: KeySlot): KeySlot | null {
  const preferred = getKeyBySlot(defaultSlot);
  if (preferred) return preferred.slot;
  if (KEY_OPTIONS.length > 0) return KEY_OPTIONS[0].slot;
  return null;
}
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE 4: src/context/AppContext.tsx  [CHANGE — complete replacement]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Changes from the live repo version:
//
//   1. AppTab union gains "app-config" (for the new App Config tab).
//      "appearance" is still a local DisplayTab in App.tsx — not here.
//
//   2. AppState gains:
//        appConfig: AppConfig   — the app-wide config slice
//        selectedKeySlot: KeySlot | null  — tracks which dropdown
//          option is active so the dropdown can reflect current state
//
//   3. New actions:
//        SET_APP_CONFIG_DEFAULT_SLOT — updates defaultKeySlot in
//          appConfig AND immediately re-resolves + dispatches the
//          active apiKey. Keeps state coherent in one action.
//
//   4. initialState.apiKey is set by resolveInitialApiKey() using
//      APP_CONFIG.defaultKeySlot — so the correct key is in state
//      before the first render, matching the persistence pattern
//      established in the appearance handoff.
//
//   5. initialState.selectedKeySlot mirrors the resolved slot so
//      ConfigTab can set the dropdown's initial value without
//      re-reading the env.
//
//   6. activeTab initial value stays "config" — but since
//      App.tsx now maps "config" to the AI Config tab (id renamed
//      to "ai-config" in the TABS array label), the user lands on
//      AI Config as before. The AppTab value "config" is renamed
//      to "ai-config" to match the new identity.
//
// NOTE ON AppTab RENAME:
//   The string "config" becomes "ai-config" in the AppTab union.
//   This means App.tsx, ConfigTab, and any code that dispatches
//   SET_TAB with "config" must use "ai-config" instead.
//   The change is confined to App.tsx and AppContext.tsx in this
//   handoff — no other files reference "config" as a tab id.
//
export const _appContextTs = `
// src/context/AppContext.tsx
import React, { createContext, useContext, useReducer, type Dispatch } from "react";

import type { FeatureConfig }  from "../types/featureConfig";
import type { MergedResult }   from "../types/recommendation";
import type { ChunkProgress }  from "../lib/proofreadingSession";
import { TESTING_DEFAULTS }    from "../config/featureConfig";

import type { AppConfig, KeySlot } from "../types/appConfig";
import { APP_CONFIG }              from "../config/appConfig";
import { resolveInitialApiKey, resolveInitialSlot, getKeyBySlot } from "../lib/apiKeys";

// ── Tab type ──────────────────────────────────────────────────────
// "config" renamed to "ai-config" to reflect scope separation.
// "app-config" added for the new App Config tab.
export type AppTab =
  | "ai-config"
  | "input"
  | "output"
  | "playground"
  | "app-config";

// ── App state ─────────────────────────────────────────────────────
export interface AppState {
  // credentials
  apiKey: string;
  selectedKeySlot: KeySlot | null; // which dropdown option is active
  // app-wide config
  appConfig: AppConfig;
  // feature config (AI / proofreading behaviour)
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
  // dev
  promptOverride: string | undefined;
}

// ── Actions ───────────────────────────────────────────────────────
export type AppAction =
  | { type: "SET_API_KEY";    key: string }
  | { type: "SELECT_KEY_SLOT"; slot: KeySlot }   // dropdown selection
  | { type: "SET_CFG";        cfg: Partial<FeatureConfig> }
  | { type: "SET_INPUT";      text: string; fileName?: string }
  | { type: "SESSION_START" }
  | { type: "SESSION_PROGRESS"; progress: ChunkProgress }
  | { type: "SESSION_DONE";   result: MergedResult }
  | { type: "SESSION_ERROR";  message: string }
  | { type: "SET_TAB";        tab: AppTab }
  | { type: "SET_PROMPT_OVERRIDE"; prompt: string | undefined }
  | { type: "SET_APP_CONFIG_DEFAULT_SLOT"; slot: KeySlot };

// ── Reducer ───────────────────────────────────────────────────────
function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {

    case "SET_API_KEY":
      return { ...state, apiKey: action.key };

    // User picks a key from the ConfigTab dropdown.
    // Store both the resolved value (for request paths) and the
    // slot number (for dropdown controlled-value display).
    case "SELECT_KEY_SLOT": {
      const opt = getKeyBySlot(action.slot);
      return {
        ...state,
        selectedKeySlot: action.slot,
        apiKey: opt ? opt.value : state.apiKey,
      };
    }

    case "SET_CFG":
      return { ...state, cfg: { ...state.cfg, ...action.cfg } };

    case "SET_INPUT":
      return {
        ...state,
        inputText:    action.text,
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

    // App Config tab: user changes the default key slot.
    // This updates appConfig.defaultKeySlot (the persisted preference)
    // AND immediately re-resolves the active key for the current session,
    // so the change takes effect without requiring a reload.
    case "SET_APP_CONFIG_DEFAULT_SLOT": {
      const opt = getKeyBySlot(action.slot);
      return {
        ...state,
        appConfig: { ...state.appConfig, defaultKeySlot: action.slot },
        selectedKeySlot: action.slot,
        apiKey: opt ? opt.value : state.apiKey,
      };
    }

    default:
      return state;
  }
}

// ── Initial state ─────────────────────────────────────────────────
// apiKey and selectedKeySlot are resolved synchronously from env
// at module load time — correct values are in state before first render.
const initialState: AppState = {
  apiKey:          resolveInitialApiKey(APP_CONFIG.defaultKeySlot),
  selectedKeySlot: resolveInitialSlot(APP_CONFIG.defaultKeySlot),
  appConfig:       APP_CONFIG,
  cfg:             TESTING_DEFAULTS,
  inputText:       "",
  inputFileName:   "",
  running:         false,
  progress:        [],
  result:          null,
  sessionError:    "",
  activeTab:       "ai-config",
  promptOverride:  undefined,
};

// ── Context ───────────────────────────────────────────────────────
const StateCtx    = createContext<AppState>(initialState);
const DispatchCtx = createContext<Dispatch<AppAction>>(() => undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        {children}
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export const useAppState    = () => useContext(StateCtx);
export const useAppDispatch = () => useContext(DispatchCtx);
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE 5: src/components/tabs/ConfigTab.tsx  [CHANGE]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Changes from the live repo version:
//
//   1. API Key card: password input → labeled key dropdown.
//      - Uses KEY_OPTIONS from src/lib/apiKeys.ts
//      - Dispatches SELECT_KEY_SLOT on change
//      - Controlled by state.selectedKeySlot
//      - Graceful degradation if KEY_OPTIONS is empty
//      - Server-side key note preserved
//
//   2. All other cards are identical to the live repo version.
//      (No UI audit semantic class upgrades applied here to keep
//       this handoff focused. Those are a separate concern.)
//
export const _configTabTs = `
// src/components/tabs/ConfigTab.tsx
// Renamed scope: "AI Config" — Cohere AI settings only.
// App-wide defaults live in AppConfigTab.
import { useAppState, useAppDispatch } from "../../context/AppContext";
import { TESTING_DEFAULTS, PRODUCTION_DEFAULTS, AVAILABLE_MODELS } from "../../config/featureConfig";
import { ConnectionPanel } from "../shared/ConnectionPanel";
import { UsageMonitor }    from "../shared/UsageMonitor";
import { KEY_OPTIONS }     from "../../lib/apiKeys";
import type { FeatureConfig, CustomInstructionsMode } from "../../types/featureConfig";
import type { KeySlot } from "../../types/appConfig";

export function ConfigTab() {
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const { cfg, selectedKeySlot, appConfig } = state;

  const set = (patch: Partial<FeatureConfig>) => dispatch({ type: "SET_CFG", cfg: patch });

  const switchTier = (tier: "testing" | "production") => {
    const defaults = tier === "testing" ? TESTING_DEFAULTS : PRODUCTION_DEFAULTS;
    dispatch({ type: "SET_CFG", cfg: defaults });
  };

  const hasClientKeys = KEY_OPTIONS.length > 0;

  return (
    <div className="space-y-4">

      {/* ── API Key selector ────────────────────────────────── */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">🔑 API Key</h3>

        <p className="text-xs text-gray-500 mb-3">
          Preferred: set <code className="bg-gray-100 px-1 rounded">COHERE_API_KEY</code> on
          the local proxy — no client-side key required.
          The selector below is for multi-key dev/testing scenarios only.
        </p>

        {hasClientKeys ? (
          <>
            <select
              value={selectedKeySlot ?? ""}
              onChange={e => {
                const slot = parseInt(e.target.value, 10) as KeySlot;
                dispatch({ type: "SELECT_KEY_SLOT", slot });
              }}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none
                         focus:border-[#1c2b4a] transition-colors"
              aria-label="Select API key"
            >
              {/* Placeholder shown only when nothing is selected yet */}
              {selectedKeySlot === null && (
                <option value="" disabled>Select API key…</option>
              )}
              {KEY_OPTIONS.map(opt => (
                <option key={opt.slot} value={opt.slot}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Active slot indicator — confirms which key is live */}
            {selectedKeySlot !== null && (
              <p className="text-xs text-green-600 mt-1.5">
                ✓ Active: {KEY_OPTIONS.find(k => k.slot === selectedKeySlot)?.label ?? \`Key \${selectedKeySlot}\`}
                {" "}(slot {selectedKeySlot})
              </p>
            )}

            {/* Default slot badge — shows if active != configured default */}
            {selectedKeySlot !== null &&
              selectedKeySlot !== appConfig.defaultKeySlot && (
              <p className="text-xs text-amber-600 mt-0.5">
                ⚠ Default slot is {appConfig.defaultKeySlot} — this selection is session-only.
              </p>
            )}
          </>
        ) : (
          // No client-side keys configured — degrade gracefully
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500">
            No client-side API keys configured.
            The app will use the server-side proxy key.
            To add keys, set <code className="bg-white px-1 rounded border">VITE_COHERE_API_KEY_1</code> … in your <code className="bg-white px-1 rounded border">.env</code> file.
          </div>
        )}
      </div>

      <ConnectionPanel />

      {/* ── Tier toggle ─────────────────────────────────────── */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">⚙ Plan Tier</h3>
        <div className="flex gap-3">
          {(["testing", "production"] as const).map(tier => (
            <button
              key={tier}
              onClick={() => switchTier(tier)}
              className={\`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors
                \${cfg.tier === tier
                  ? "bg-[#1c2b4a] text-white border-[#1c2b4a]"
                  : "bg-white text-gray-600 border-gray-300 hover:border-[#1c2b4a]"}\`}
            >
              {tier === "testing" ? "🔬 Testing" : "🚀 Production"}
            </button>
          ))}
        </div>
        {cfg.tier === "production" && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠ Command A+ production access requires contacting Cohere sales — it is not self-serve.
          </p>
        )}
      </div>

      {/* ── Model selection ─────────────────────────────────── */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">🤖 Model</h3>
        <select
          value={cfg.modelId}
          onChange={e => set({ modelId: e.target.value as FeatureConfig["modelId"] })}
          className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1c2b4a]"
        >
          {AVAILABLE_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* ── Inference Parameters ─────────────────────────────── */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">🌡 Inference Parameters</h3>
        <div className="space-y-4">

          {/* Temperature */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="font-semibold text-gray-600">Temperature</label>
              <span className="font-bold text-[#1c2b4a]">{cfg.temperature.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400 mb-1">
              Note: values below 0.4 have been empirically observed to produce degraded output with this model.
            </p>
            <input
              type="range" min={0} max={1} step={0.05} value={cfg.temperature}
              onChange={e => set({ temperature: Number(e.target.value) })}
              className="w-full accent-[#1c2b4a]"
            />
          </div>

          {/* Seed */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="font-semibold text-gray-600">Seed</label>
              <span className="font-bold text-[#1c2b4a]">{cfg.seed}</span>
            </div>
            <input
              type="number" value={cfg.seed}
              onChange={e => set({ seed: parseInt(e.target.value, 10) || 42 })}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1c2b4a]"
            />
          </div>

          {/* Thinking toggle */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="font-semibold text-gray-600">Thinking</label>
              <span className="font-bold text-[#1c2b4a]">
                {cfg.thinkingDisabled ? "Disabled" : "Enabled"}
              </span>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => set({ thinkingDisabled: !cfg.thinkingDisabled })}
                className={\`w-11 h-6 rounded-full transition-colors cursor-pointer relative
                  \${cfg.thinkingDisabled ? "bg-[#1c2b4a]" : "bg-gray-300"}\`}
              >
                <div className={\`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all
                  \${cfg.thinkingDisabled ? "left-6" : "left-1"}\`} />
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {cfg.thinkingDisabled ? "Send thinking: disabled" : "Allow model thinking"}
              </span>
            </label>
            <p className="text-xs text-gray-400 mt-2">
              This setting is sent to the model and is now also honored by the connection test.
            </p>
          </div>

          {/* Max chunk chars */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="font-semibold text-gray-600">Max Chunk Characters</label>
              <span className="font-bold text-[#1c2b4a]">{cfg.maxChunkChars.toLocaleString()}</span>
            </div>
            <input
              type="range" min={500} max={8000} step={100} value={cfg.maxChunkChars}
              onChange={e => set({ maxChunkChars: Number(e.target.value) })}
              className="w-full accent-[#1c2b4a]"
            />
          </div>
        </div>
      </div>

      {/* ── Multi-Turn Chunking ──────────────────────────────── */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">🔄 Multi-Turn Chunking</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set({ multiTurn: !cfg.multiTurn })}
            className={\`w-11 h-6 rounded-full transition-colors cursor-pointer relative
              \${cfg.multiTurn ? "bg-[#1c2b4a]" : "bg-gray-300"}\`}
          >
            <div className={\`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all
              \${cfg.multiTurn ? "left-6" : "left-1"}\`} />
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {cfg.multiTurn
              ? "Multi-turn (chunks as conversation turns)"
              : "Stateless (independent calls per chunk)"}
          </span>
        </label>
        <p className="text-xs text-gray-400 mt-2">
          Multi-turn sends the system prompt once and appends chunks.
          Stateless re-sends the full system prompt per chunk.
        </p>
      </div>

      {/* ── Custom Instructions ──────────────────────────────── */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">📋 Custom Instructions</h3>
        <div className="flex gap-2 mb-3">
          {(["none", "additive", "override"] as CustomInstructionsMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => set({ customInstructionsMode: mode })}
              className={\`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                \${cfg.customInstructionsMode === mode
                  ? "bg-[#1c2b4a] text-white border-[#1c2b4a]"
                  : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"}\`}
            >
              {mode === "none" ? "None" : mode === "additive" ? "Additive" : "Override"}
            </button>
          ))}
        </div>
        {cfg.customInstructionsMode === "override" && (
          <p className="text-xs text-amber-600 mb-2">
            Override replaces editorial preferences only — structural output rules are always enforced.
          </p>
        )}
        {cfg.customInstructionsMode !== "none" && (
          <textarea
            dir="rtl"
            value={cfg.customInstructions}
            onChange={e => set({ customInstructions: e.target.value })}
            rows={4}
            placeholder="أدخل تعليمات إضافية هنا…"
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none
                       focus:border-[#1c2b4a] arabic-text resize-y"
          />
        )}
      </div>

      <UsageMonitor />

    </div>
  );
}
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE 6: src/components/tabs/AppConfigTab.tsx  [NEW]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// The App Config tab. Owns app-wide defaults, not AI settings.
// Current scope: default key slot selector + locale stub.
// Position: last in tab strip (visible to all, not dev-only).
//
export const _appConfigTabTs = `
// src/components/tabs/AppConfigTab.tsx
import { useAppState, useAppDispatch } from "../../context/AppContext";
import { KEY_OPTIONS } from "../../lib/apiKeys";
import type { KeySlot } from "../../types/appConfig";

export function AppConfigTab() {
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const { appConfig, selectedKeySlot } = state;

  const hasClientKeys = KEY_OPTIONS.length > 0;

  return (
    <div className="space-y-4">

      {/* ── Default API Key Slot ─────────────────────────────── */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-1 border-b pb-2">🔑 Default API Key</h3>
        <p className="text-xs text-gray-400 mb-3">
          The key slot selected here is auto-applied on every cold load.
          It does not persist between sessions — the selection resets on refresh.
        </p>

        {hasClientKeys ? (
          <>
            <select
              value={appConfig.defaultKeySlot}
              onChange={e => {
                const slot = parseInt(e.target.value, 10) as KeySlot;
                dispatch({ type: "SET_APP_CONFIG_DEFAULT_SLOT", slot });
              }}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none
                         focus:border-[#1c2b4a] transition-colors"
              aria-label="Default API key slot"
            >
              {KEY_OPTIONS.map(opt => (
                <option key={opt.slot} value={opt.slot}>
                  {opt.label} (slot {opt.slot})
                </option>
              ))}
            </select>

            <div className="mt-2 space-y-0.5">
              <p className="text-xs text-green-600">
                ✓ Currently active: {
                  KEY_OPTIONS.find(k => k.slot === selectedKeySlot)?.label
                  ?? (selectedKeySlot ? \`Key \${selectedKeySlot}\` : "None")
                }
              </p>
              <p className="text-xs text-gray-400">
                To change the active key for this session only, use the dropdown
                in the AI Config tab.
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500">
            No client-side API keys configured.
            Add <code className="bg-white px-1 rounded border">VITE_COHERE_API_KEY_1</code> … to
            your <code className="bg-white px-1 rounded border">.env</code> file to enable
            the key selector.
          </div>
        )}
      </div>

      {/* ── Locale (future hook) ────────────────────────────── */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-1 border-b pb-2">🌐 Language / Locale</h3>
        <p className="text-xs text-gray-400 mb-3">
          Interface language settings will appear here when localisation is implemented.
        </p>
        <div className="rounded-lg bg-gray-50 border border-dashed border-gray-300 px-4 py-3
                        text-xs text-gray-400 text-center">
          Coming soon — locale support not yet implemented
        </div>
      </div>

    </div>
  );
}
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE 7: src/App.tsx  [CHANGE — complete replacement]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Changes from the live repo version:
//
//   1. ConfigTab import renamed to ConfigTab (component name stays;
//      the tab label in TABS changes from "⚙ Config" to "⚙ AI Config").
//
//   2. AppConfigTab imported and added as the last tab.
//
//   3. TABS array updated:
//        - "config" id → "ai-config"
//        - label "⚙ Config" → "⚙ AI Config"
//        - "🛠 Playground" stays devOnly: true
//        - "🎨 Appearance" stays devOnly: true (stub — UiTab not yet applied)
//        - "🔧 App Config" added last, not devOnly
//
//   4. Tab strip order:
//        ⚙ AI Config | ✏ Input | 📄 Output |
//        🛠 Playground (dev) | 🎨 Appearance (dev) | 🔧 App Config
//
//   5. activeTab type is now AppTab from the updated context.
//      Initial value is "ai-config" (was "config").
//
//   NOTE: The "🎨 Appearance" tab renders a placeholder <div> here
//   because UiTab.tsx has not yet been applied from ui-audit-handoff.ts.
//   If UiTab is already in place, replace the placeholder with:
//     import { UiTab } from "./components/tabs/UiTab";
//     and: {activeTab === "appearance" && IS_DEV && <UiTab />}
//
export const _appTsx = `
// src/App.tsx
import { AppProvider, useAppState, useAppDispatch, type AppTab } from "./context/AppContext";
import { ConfigTab }     from "./components/tabs/ConfigTab";
import { InputTab }      from "./components/tabs/InputTab";
import { OutputTab }     from "./components/tabs/OutputTab";
import { PlaygroundTab } from "./components/tabs/PlaygroundTab";
import { AppConfigTab }  from "./components/tabs/AppConfigTab";
// If UiTab has been applied from ui-audit-handoff.ts, uncomment:
// import { UiTab } from "./components/tabs/UiTab";

const IS_DEV = import.meta.env.DEV;

const TABS: Array<{ id: AppTab; label: string; devOnly?: boolean }> = [
  { id: "ai-config",  label: "⚙ AI Config" },
  { id: "input",      label: "✏ Input" },
  { id: "output",     label: "📄 Output" },
  { id: "playground", label: "🛠 Playground",  devOnly: true },
  { id: "appearance", label: "🎨 Appearance",  devOnly: true },
  { id: "app-config", label: "🔧 App Config" },
];

function Shell() {
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const { activeTab, result } = state;

  const visibleTabs = TABS.filter(t => !t.devOnly || IS_DEV);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-[#1c2b4a] tracking-tight">
            Arabic Text Proofreader
          </h1>
          <p className="arabic-text text-lg text-gray-500 mt-1">مدقق النصوص العربية</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-3 py-1 font-medium">
              Powered by Cohere · command-r7b-arabic
            </span>
            {IS_DEV && (
              <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-1 font-bold">
                DEV
              </span>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex bg-white rounded-t-xl shadow-sm border-b border-gray-100 overflow-hidden mb-0">
          {visibleTabs.map(tab => {
            const active    = activeTab === tab.id;
            const hasResult = tab.id === "output" && result &&
                              result.clean.length + result.flagged.length > 0;
            return (
              <button
                key={tab.id}
                onClick={() => dispatch({ type: "SET_TAB", tab: tab.id })}
                className={\`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors relative
                  \${active
                    ? "border-[#1c2b4a] text-[#1c2b4a]"
                    : "border-transparent text-gray-400 hover:text-gray-600"}\`}
              >
                {tab.label}
                {hasResult && !active && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="bg-gray-100 rounded-b-xl pt-4">
          {activeTab === "ai-config"  && <ConfigTab />}
          {activeTab === "input"      && <InputTab />}
          {activeTab === "output"     && <OutputTab />}
          {activeTab === "playground" && IS_DEV && <PlaygroundTab />}
          {activeTab === "appearance" && IS_DEV && (
            // Replace with <UiTab /> once ui-audit-handoff.ts has been applied
            <div className="rounded-xl bg-white p-5 shadow-sm text-center text-gray-400 text-sm">
              🎨 Appearance tab — apply ui-audit-handoff.ts to enable
            </div>
          )}
          {activeTab === "app-config" && <AppConfigTab />}
        </div>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DESIGN NOTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const _designNotes = `
/*
════════════════════════════════════════════════════════════════
DESIGN NOTES
════════════════════════════════════════════════════════════════

── Why KEY_OPTIONS is a module-level constant ───────────────────

import.meta.env is a compile-time object in Vite — its values are
inlined at build time, never read at runtime from the OS. Reading
it once at module load and storing the result in KEY_OPTIONS means:
  - No repeated env lookups per render
  - Referentially stable array (safe in useCallback deps, etc.)
  - Easy to mock in tests by swapping the module

── Why the key value is stored in state.apiKey, not derived ─────

The brief says: "keep AppState.apiKey as the active key string to
minimize churn." All downstream consumers (ConnectionPanel, InputTab,
PlaygroundTab, cohereClient, proofreadingSession) already read
state.apiKey or receive it as an argument. No changes to those files.

SELECT_KEY_SLOT looks up the value from KEY_OPTIONS and stores it
in state.apiKey immediately. No getKeyBySlot() call at request time.

── Why selectedKeySlot is separate from apiKey in state ─────────

The dropdown is a controlled component — it needs a stable value
to display. If we only stored the key string, we couldn't reliably
reverse-map it to a slot number for the <select value={...}>.
(Two slots could theoretically share a key value in unusual setups.)
Storing selectedKeySlot separately makes the dropdown's controlled
value unambiguous and cheap to read.

── Why SET_APP_CONFIG_DEFAULT_SLOT also updates the active key ───

When the user changes the default slot in AppConfigTab, the intent
is "this is now my preferred key." Making that change also activate
the new key for the current session is the least-surprising behavior.
It avoids the confusion of: "I changed the default to Key 3, but
Key 1 is still active right now." One action, coherent state.

── Why "appearance" is AppTab even though UiTab is not yet applied ──

AppTab includes "appearance" so App.tsx can dispatch SET_TAB to it
and the type system is satisfied. The rendered content is a
placeholder <div> until UiTab from ui-audit-handoff.ts is applied.
This avoids a type change when that handoff is applied later.

── Why App Config tab is not devOnly ────────────────────────────

The defaultKeySlot setting is operationally necessary — it lets
any developer configure which key auto-selects on load without
editing env files mid-session. This is a workflow tool, not a
debugging tool, so it should be accessible in all builds.
The Appearance tab remains devOnly because skin/density preferences
are still in the design-system hardening phase.

── AppTab "config" → "ai-config" rename impact ─────────────────

The only files that reference the string "config" as a tab id are:
  - AppContext.tsx  (initialState.activeTab, type union)
  - App.tsx         (TABS array, tab content conditional)

No other file dispatches SET_TAB with "config" or uses the tab id
as a string literal. The rename is fully contained in these two files.
*/
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VERIFICATION CHECKLIST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const _verificationChecklist = `
/*
════════════════════════════════════════════════════════════════
VERIFICATION CHECKLIST
════════════════════════════════════════════════════════════════

── Build ────────────────────────────────────────────────────────

□ npm run build → exits 0, no TypeScript errors.

── Tab strip ────────────────────────────────────────────────────

□ Tab strip shows (in order):
    ⚙ AI Config | ✏ Input | 📄 Output | 🔧 App Config
  In DEV mode, also shows:
    🛠 Playground | 🎨 Appearance (between Output and App Config)

□ App loads with "AI Config" tab active (not "Config").

── Key dropdown — keys configured scenario ──────────────────────

(Requires VITE_COHERE_API_KEY_1 and VITE_COHERE_API_KEY_LABEL_1
 to be set in the .env file.)

□ AI Config tab shows a <select> instead of a password input.
□ Dropdown lists all configured key labels (no empty slots shown).
□ On load, the dropdown reflects VITE_APP_DEFAULT_KEY_SLOT (or slot 1
  if that var is absent).
□ Selecting a different key from the dropdown:
    → Active key confirmation line updates (✓ Active: Key X)
    → If selected != default slot, amber warning appears
    → Connection test uses the newly selected key
    → Starting a proofreading session uses the newly selected key

── Key dropdown — no keys configured scenario ───────────────────

(Temporarily remove VITE_COHERE_API_KEY_1 from .env to test.)

□ AI Config tab shows the "no client-side keys configured" info box.
□ No console errors.
□ App still loads and operates normally using the server-side proxy key.

── App Config tab ───────────────────────────────────────────────

□ 🔧 App Config tab is visible and renders two cards:
    "🔑 Default API Key" and "🌐 Language / Locale".
□ Default API Key card shows the same key options as the AI Config
  dropdown.
□ Changing the default slot in App Config:
    → Immediately updates the active key (✓ Currently active: Key X)
    → Updates the AI Config dropdown to match
    → Connection test uses the new key
□ Locale card shows the "Coming soon" placeholder.

── Downstream request paths ─────────────────────────────────────

□ Connection test (ConnectionPanel) uses the key from the dropdown.
□ "Start Proofreading" (InputTab) uses the key from the dropdown.
□ Playground single-chunk test uses the key from the dropdown.

── Regression ───────────────────────────────────────────────────

□ All AI Config controls still work: tier, model, temperature, seed,
  thinking toggle, chunk size, multi-turn, custom instructions.
□ Input tab: text entry, file upload, submit all work.
□ Output tab: results display after a session.
□ Playground tab (dev): renders and submits normally.
□ No reference to the old "config" tab id causes a type error.
*/
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// END OF HANDOFF
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// NEW FILES (4)
//   src/types/appConfig.ts           — AppConfig, KeySlot types
//   src/config/appConfig.ts          — APP_CONFIG constant from env
//   src/lib/apiKeys.ts               — KEY_OPTIONS, resolveInitialApiKey,
//                                      resolveInitialSlot, getKeyBySlot
//   src/components/tabs/AppConfigTab.tsx — 🔧 App Config tab
//
// CHANGED FILES (3)
//   src/context/AppContext.tsx       — AppTab union, appConfig + selectedKeySlot
//                                      in state, SELECT_KEY_SLOT +
//                                      SET_APP_CONFIG_DEFAULT_SLOT actions,
//                                      initialState auto-select
//   src/components/tabs/ConfigTab.tsx — API Key card → labeled dropdown
//   src/App.tsx                      — Tab rename, new tab, strip reorder
//
// UNCHANGED FILES (5)
//   src/components/shared/ConnectionPanel.tsx
//   src/components/tabs/InputTab.tsx
//   src/components/tabs/PlaygroundTab.tsx
//   src/lib/cohereClient.ts
//   src/lib/proofreadingSession.ts
