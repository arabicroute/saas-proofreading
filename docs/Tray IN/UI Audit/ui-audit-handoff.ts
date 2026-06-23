/**
 * ============================================================
 * UI CO-DESIGNER HANDOFF — cohere-proofreader
 * Date: 2026-06-21
 * Author: Design Systems Engineer (AI Co-Designer)
 * Target repo: arabicroute/saas-proofreading (main)
 * ============================================================
 *
 * HOW TO APPLY THIS FILE
 * ──────────────────────
 * Each section is marked with a FILE header. Copy the content
 * between the matching START / END delimiters into the path shown.
 * New files are marked [NEW]. Changed files are marked [CHANGE].
 * All changes are additive-first; no existing logic is removed
 * unless the old code is explicitly shown with a strikethrough note.
 *
 * ROLLOUT ORDER (safest sequence)
 *   1. src/types/uiConfig.ts          [NEW]
 *   2. src/config/uiConfig.ts         [NEW]
 *   3. src/lib/uiSelectors.ts         [NEW]
 *   4. src/context/AppContext.tsx      [CHANGE — add UiState slice]
 *   5. src/index.css                  [CHANGE — add @theme tokens + semantic layers]
 *   6. tailwind.config.ts             [CHANGE — retire v3-style config, add plugin note]
 *   7. src/App.tsx                    [CHANGE — semantic ids, dir wiring, Appearance tab]
 *   8. src/components/tabs/UiTab.tsx  [NEW]
 *   9. src/components/tabs/ConfigTab.tsx   [CHANGE — semantic ids + data attrs]
 *  10. src/components/tabs/InputTab.tsx    [CHANGE — semantic ids + data attrs]
 *  11. src/components/tabs/OutputTab.tsx   [CHANGE — semantic ids + data attrs]
 *  12. src/components/shared/ConnectionPanel.tsx [CHANGE — semantic ids]
 *
 * ============================================================
 */


// ╔══════════════════════════════════════════════════════════════╗
// ║  DELIVERABLE 1 — WRITTEN AUDIT & RECOMMENDATIONS             ║
// ╚══════════════════════════════════════════════════════════════╝
//
// Embedded here as structured comments so it travels with the code.
// A clean markdown copy is also produced at the bottom of this file.

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION A — LAYOUT AND USABILITY AUDIT FINDINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A1. BRAND COLOR IS HARD-CODED IN EVERY FILE
  - `#1c2b4a` appears in App.tsx, ConfigTab.tsx, InputTab.tsx,
    OutputTab.tsx, ConnectionPanel.tsx — each file individually.
  - Zero single source of truth. A palette change requires grep.
  - Fix: Move to a CSS custom property --color-brand-900 in @theme {}.

A2. CARD SHELL IS REPEATED WITHOUT ABSTRACTION
  - `rounded-xl bg-white p-5 shadow-sm` appears verbatim 9+ times.
  - No semantic wrapper, no shared class.
  - Fix: Define a .settings-card utility in @layer components {}.

A3. TAB BAR HAS NO SEMANTIC HOOKS
  - Buttons have zero id or className beyond raw Tailwind utilities.
  - Impossible to target from CSS overrides, tests, or future themes.
  - Fix: Add id="tab-button-{id}" and className="tab-button" per button.

A4. TOGGLE CONTROLS ARE DIVs WITH onClick — ACCESSIBILITY GAP
  - `<div onClick={...} className="w-11 h-6 rounded-full ...">` is
    not keyboard-focusable, has no role, no aria-checked, no label.
  - Screen readers see a generic div — the toggle is invisible to AT.
  - Fix: Replace with <button role="switch" aria-checked={bool}>.

A5. CARD SECTION HEADINGS RELY ON EMOJI FOR MEANING
  - "🔑 API Key", "🤖 Model" — emoji carry structural intent.
  - Screen readers announce the emoji name, which breaks flow.
  - Fix: Wrap emoji in <span aria-hidden="true"> inside headings.

A6. ConfigTab IS OVER-TALL — 6 FULL CARDS STACKED VERTICALLY
  - The page requires excessive scrolling to review all settings.
  - Cards have no collapsible behavior.
  - Fix (incremental): Add data-panel-hidden attr + UiState toggle.
    Full collapse UI lives in UiTab; Config reads the visibility flag.

A7. CARD PADDING IS ONE-SIZE-FITS-ALL
  - All cards use p-5 regardless of content density.
  - The tiny "Multi-Turn Chunking" toggle card uses same padding as
    the "Inference Parameters" card with 4 sub-controls.
  - Fix: p-4 for single-control cards; keep p-5 for multi-control.
    Expressed via .settings-card--compact utility variant.

A8. TEXT SIZE HIERARCHY IS FLAT
  - Card headers: text-sm font-bold (h3 tag).
  - Labels: text-sm font-semibold.
  - Help text: text-xs text-gray-400.
  - Active tab label: text-xs font-semibold — same as inactive.
  - No clear H1 → label → caption rhythm.
  - Fix: Tab labels → text-sm; card headers → text-base font-semibold;
    label → text-sm; caption → text-xs. Defined in @theme.

A9. OUTPUT STATS BAR HAS NO ACCESSIBLE LABELS
  - `<div className="text-xs text-gray-400 mb-1">{label}</div>`
    above a bold number has no semantic association.
  - Fix: Wrap in <dl><dt>/<dd> pairs with aria-label on the metric.

A10. RTL DIRECTION IS APPLIED ONLY TO LEAF TEXT NODES
   - `dir="rtl"` on textarea and arabic-text spans only.
   - If a future user wants to flip the whole shell to RTL
     (e.g. for a fully Arabic-speaking operator), there is no
     coordination point.
   - Fix: Introduce UiState.dir.global + UiState.dir.pageOverride
     and apply on the tab-content wrapper in App.tsx.

A11. DEBUG PANEL IN ConnectionPanel HAS NO VISIBILITY CONTROL IN STATE
   - `showDebug` is pure local useState — not part of any persistent
     or cross-component visibility model.
   - Fix: Keep local state but add data-panel-hidden attr so UiTab
     can later offer "always expand debug" as a preference.

A12. NO FOCUS-VISIBLE STYLES DEFINED
   - No :focus-visible rule in index.css.
   - Browsers use default outlines; some themes suppress them entirely.
   - Fix: Add a consistent :focus-visible rule in @layer base {}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION B — NEW UI-MANAGEMENT TAB DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

B1. TAB PLACEMENT & NAME
   - Tab id: "appearance"
   - Label: "🎨 Appearance"
   - Position: after "output", before "playground" (dev-only)
   - devOnly: true for now (per your preference — battle-test before
     exposing to production users as a preset system)

B2. WHAT LIVES IN UiTab VS ConfigTab
   ┌──────────────────────┬─────────────────────────────────────┐
   │ ConfigTab (keeps)    │ UiTab (new home)                    │
   ├──────────────────────┼─────────────────────────────────────┤
   │ API Key              │ Skin / color preset selector         │
   │ Connection test      │ Panel visibility toggles            │
   │ Plan tier            │ Global text direction (LTR / RTL)   │
   │ Model selection      │ Per-tab direction override          │
   │ Inference params     │ Arabic font selector (future)       │
   │ Multi-turn chunking  │ Density mode (default / compact)    │
   │ Custom instructions  │ (Future) dark mode toggle           │
   └──────────────────────┴─────────────────────────────────────┘

B3. UiState SCHEMA (see types/uiConfig.ts below for full types)
   - skin: "default" | "warm" | "high-contrast"
   - density: "default" | "compact"
   - dir.global: "ltr" | "rtl"
   - dir.pageOverride: Partial<Record<AppTab, "ltr" | "rtl" | "inherit">>
   - panels: Record<PanelId, { hidden: boolean }>

B4. HOW SKIN WORKS AT RUNTIME
   - UiTab writes skin value into UiState.
   - App.tsx reads skin and applies it as a data attribute on the
     root div: data-skin="warm".
   - CSS in index.css defines [data-skin="warm"] { --color-brand-... }
     overrides, so no JS class toggling needed.
   - Tailwind never needs a safelist because these are CSS vars, not
     utility classes.

B5. HOW PANEL VISIBILITY WORKS
   - Each card receives a data-panel-hidden attribute from UiState.
   - A Tailwind v4 data-variant rule hides it:
       [data-panel-hidden=true] { display: none; }
   - UiTab presents toggle rows for each named panel.
   - No conditional rendering — the DOM stays present; only display
     is toggled. This preserves form state while panels are hidden.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION C — SELECTOR NAMING PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

C1. NAMING CONVENTIONS
   - className tokens (semantic layer): kebab-case nouns describing
     the element's role in the design system, not its appearance.
   - id attributes: {role}-{qualifier} — always unique per page.
   - data-* attributes: data-{domain}-{property}

C2. APPROVED SELECTOR VOCABULARY

   APP SHELL
     id="app-shell"                  — root page wrapper
     id="app-header"                 — logo / title block
     id="app-tab-bar"                — the full tab strip
     className="tab-button"          — every tab button
     id="tab-button-{tabId}"         — e.g. tab-button-config
     id="tab-panel-{tabId}"          — the active content wrapper
     id="app-content"                — outer content area below tabs

   CARDS & SECTIONS
     className="settings-card"       — standard white rounded card
     className="settings-card--compact"  — single-control variant
     id="settings-card-{name}"       — e.g. settings-card-api-key
                                         settings-card-connection
                                         settings-card-tier
                                         settings-card-model
                                         settings-card-inference
                                         settings-card-multiturn
                                         settings-card-instructions
     data-panel-hidden="true|false"  — visibility flag (read by CSS)

   FORM CONTROLS
     className="field-label"         — <label> or heading for a control
     className="field-caption"       — help text below a control
     className="field-input"         — text/number/password <input>
     className="field-select"        — <select>
     className="field-textarea"      — <textarea>
     className="field-range"         — range slider

   TOGGLE SWITCH (accessibility fix)
     className="toggle-switch"       — <button role="switch">
     className="toggle-switch__track"  — visual pill
     className="toggle-switch__thumb"  — sliding dot
     data-checked="true|false"       — drives CSS state

   SEGMENTED BUTTON GROUPS (tier / custom-instructions mode)
     className="segment-group"       — wrapper
     className="segment-button"      — individual option
     data-selected="true|false"

   BANNERS & STATUS
     className="status-banner"       — generic notice wrapper
     className="status-banner--warn" — amber warning variant
     className="status-banner--error"— red error variant
     className="status-banner--ok"   — green success variant
     id="banner-no-api-key"
     id="banner-session-error"
     id="banner-prod-tier-warning"

   ACTION BUTTONS
     className="action-button--primary"    — main CTA (Start Proofreading)
     className="action-button--secondary"  — secondary (Test Connection)
     className="action-button--ghost"      — text-only (Clear, Show debug)
     id="action-start-proofreading"
     id="action-test-connection"
     id="action-export-json"

   RESULT CARDS
     className="result-card"         — individual recommendation
     className="result-card--clean"  — green-tinted variant
     className="result-card--flagged"— amber-tinted variant
     id="result-card-clean-{index}"
     id="result-card-flagged-{index}"

   STATS PANEL
     id="stats-panel"
     className="stats-grid"
     className="stats-cell"

   DEBUG PANEL
     id="debug-panel-connection"
     data-panel-hidden="true|false"

   APPEARANCE / UI TAB
     id="tab-panel-appearance"
     id="settings-card-skin"
     id="settings-card-direction"
     id="settings-card-density"
     id="settings-card-panels"
     className="skin-option"
     data-selected="true|false" on skin-option

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION D — ROLLOUT STRATEGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 1 — Token layer + selectors (zero visual change, zero risk)
  Apply files: types/uiConfig.ts, config/uiConfig.ts,
               lib/uiSelectors.ts, index.css (tokens only),
               tailwind.config.ts (retire v3 shape).
  Result: Design tokens defined, selector vocabulary established.
  Risk: None — additive only.

PHASE 2 — AppContext UiState slice (no UI change yet)
  Apply: AppContext.tsx additions.
  Result: UiState lives in context. Nothing reads it yet.
  Risk: Minimal — reducer is pure, no side effects.

PHASE 3 — App.tsx: semantic ids + dir wiring + Appearance tab
  Apply: App.tsx changes.
  Result: Tab buttons get ids. Active tab content gets dir attr.
          Appearance tab appears (dev-only).
  Risk: Low — visual identity unchanged. dir change is additive.

PHASE 4 — Semantic CSS layer (settings-card, action-button, etc.)
  Apply: index.css @layer components additions.
  Result: Shared card/button classes available for import.
  Risk: Zero — classes are opt-in.

PHASE 5 — ConfigTab, InputTab, OutputTab, ConnectionPanel selectors
  Apply each individually. Each is a search-replace of existing
  class strings + added id / data attrs. No logic changes.
  Result: Full semantic markup across all existing tabs.
  Risk: Low — only class name additions, no logic.

PHASE 6 — Accessibility fixes
  Apply: Toggle switch replacement in ConfigTab (role="switch").
         aria-hidden on emoji in card headings.
         :focus-visible in index.css.
         <dl>/<dt>/<dd> in OutputTab stats.
  Risk: Low to medium — minor DOM restructure in toggle and stats.
        Test keyboard navigation after this phase.

PHASE 7 — UiTab scaffold
  Apply: UiTab.tsx.
  Result: Appearance tab renders with skin/density/direction/panels.
  Risk: Low — dev-only tab, no production exposure.
*/


// ╔══════════════════════════════════════════════════════════════╗
// ║  DELIVERABLE 2 — SOURCE HANDOFF                              ║
// ╚══════════════════════════════════════════════════════════════╝


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE: src/types/uiConfig.ts  [NEW]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const _uiConfigTypes = `
// src/types/uiConfig.ts
// ─────────────────────────────────────────────────────────────────
// Type definitions for the UI configuration layer.
// Keep this file import-free — no React, no context, no config
// objects. Pure type shapes only.
// ─────────────────────────────────────────────────────────────────

import type { AppTab } from "../context/AppContext";

// ── Skin / Color Preset ────────────────────────────────────────────
export type UiSkin = "default" | "warm" | "high-contrast";

// ── Density Mode ──────────────────────────────────────────────────
export type UiDensity = "default" | "compact";

// ── Text Direction ────────────────────────────────────────────────
export type UiDir = "ltr" | "rtl";
export type UiDirOverride = UiDir | "inherit";

// ── Named Panel IDs ───────────────────────────────────────────────
// Extend this union as new panels are added. Each id must match
// the data-panel-id attribute placed on the card element.
export type PanelId =
  | "panel-api-key"
  | "panel-connection"
  | "panel-tier"
  | "panel-model"
  | "panel-inference"
  | "panel-multiturn"
  | "panel-instructions"
  | "panel-usage"
  | "panel-debug-connection"
  | "panel-stats"
  | "panel-clean-results"
  | "panel-flagged-results";

// ── Panel Visibility Entry ─────────────────────────────────────────
export interface PanelVisibility {
  hidden: boolean;
  label: string;          // human-readable label shown in UiTab
  tab: AppTab | "any";    // which tab this panel lives on ("any" = shared)
}

// ── Direction Config ───────────────────────────────────────────────
// Dual-level RTL/LTR model.
//   global       — baseline direction for the whole shell
//   pageOverride — per-tab override; "inherit" falls back to global
//
// Architecture note: this is intentionally NOT i18n. It is a
// layout-direction control that a future i18n layer can write into
// by dispatching SET_UI_DIR and SET_UI_DIR_OVERRIDE actions.
export interface UiDirConfig {
  global: UiDir;
  pageOverride: Partial<Record<AppTab, UiDirOverride>>;
}

// ── Root UiState shape ─────────────────────────────────────────────
export interface UiState {
  skin: UiSkin;
  density: UiDensity;
  dir: UiDirConfig;
  panels: Record<PanelId, PanelVisibility>;
}
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE: src/config/uiConfig.ts  [NEW]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const _uiConfigDefaults = `
// src/config/uiConfig.ts
// ─────────────────────────────────────────────────────────────────
// Default values for UiState. This is the single source of truth
// for what "factory reset" looks like in the Appearance tab.
// ─────────────────────────────────────────────────────────────────

import type { UiState } from "../types/uiConfig";

export const UI_DEFAULTS: UiState = {
  skin: "default",
  density: "default",
  dir: {
    global: "ltr",
    pageOverride: {
      // input and output panels handle Arabic text — default to RTL
      // at page level so the textarea is naturally RTL without needing
      // an extra inline dir="rtl" on every leaf node.
      // NOTE: individual text inputs can still override with dir="ltr"
      // if they contain mixed-direction content (e.g. file name display).
      input: "rtl",
      output: "inherit",   // output cards are bilingual; handled per-card
    },
  },
  panels: {
    "panel-api-key":           { hidden: false, label: "API Key",             tab: "config" },
    "panel-connection":        { hidden: false, label: "Connection Test",      tab: "config" },
    "panel-tier":              { hidden: false, label: "Plan Tier",            tab: "config" },
    "panel-model":             { hidden: false, label: "Model",                tab: "config" },
    "panel-inference":         { hidden: false, label: "Inference Parameters", tab: "config" },
    "panel-multiturn":         { hidden: false, label: "Multi-Turn Chunking",  tab: "config" },
    "panel-instructions":      { hidden: false, label: "Custom Instructions",  tab: "config" },
    "panel-usage":             { hidden: false, label: "Usage Monitor",        tab: "config" },
    "panel-debug-connection":  { hidden: true,  label: "Connection Debug Log", tab: "config" },
    "panel-stats":             { hidden: false, label: "Stats Bar",            tab: "output" },
    "panel-clean-results":     { hidden: false, label: "Clean Results",        tab: "output" },
    "panel-flagged-results":   { hidden: false, label: "Flagged Results",      tab: "output" },
  },
};

// Skin display metadata used by UiTab to render the skin picker.
export const SKIN_OPTIONS: Array<{
  id: UiState["skin"];
  label: string;
  description: string;
  swatchBg: string;   // Tailwind bg class for the preview swatch
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

export const DENSITY_OPTIONS: Array<{
  id: UiState["density"];
  label: string;
  description: string;
}> = [
  { id: "default", label: "Default", description: "Standard card padding (p-5)" },
  { id: "compact", label: "Compact", description: "Reduced card padding (p-3), smaller labels" },
];
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE: src/lib/uiSelectors.ts  [NEW]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const _uiSelectors = `
// src/lib/uiSelectors.ts
// ─────────────────────────────────────────────────────────────────
// Canonical selector constants for the design system.
//
// USAGE IN COMPONENTS
//   import { SEL } from "../lib/uiSelectors";
//   <button id={SEL.id.tabButton("config")} className={SEL.cls.tabButton} />
//
// USAGE IN TESTS / FUTURE E2E
//   cy.get(SEL.query.tabButton("config")).click();
//
// ─────────────────────────────────────────────────────────────────

import type { AppTab } from "../context/AppContext";
import type { PanelId } from "../types/uiConfig";

// ── Semantic className tokens ──────────────────────────────────────
// These are NOT Tailwind utilities. They live in @layer components {}
// in index.css and can be overridden per-skin.
export const CLS = {
  // Shell
  appShell:              "app-shell",
  appHeader:             "app-header",
  appTabBar:             "app-tab-bar",
  appContent:            "app-content",

  // Navigation
  tabButton:             "tab-button",
  tabButtonActive:       "tab-button--active",
  tabPanel:              "tab-panel",

  // Cards
  settingsCard:          "settings-card",
  settingsCardCompact:   "settings-card settings-card--compact",

  // Fields
  fieldLabel:            "field-label",
  fieldCaption:          "field-caption",
  fieldInput:            "field-input",
  fieldSelect:           "field-select",
  fieldTextarea:         "field-textarea",
  fieldRange:            "field-range",

  // Toggle switch
  toggleSwitch:          "toggle-switch",
  toggleSwitchTrack:     "toggle-switch__track",
  toggleSwitchThumb:     "toggle-switch__thumb",

  // Segmented button group
  segmentGroup:          "segment-group",
  segmentButton:         "segment-button",

  // Banners
  statusBanner:          "status-banner",
  statusBannerWarn:      "status-banner status-banner--warn",
  statusBannerError:     "status-banner status-banner--error",
  statusBannerOk:        "status-banner status-banner--ok",

  // Action buttons
  actionPrimary:         "action-button--primary",
  actionSecondary:       "action-button--secondary",
  actionGhost:           "action-button--ghost",

  // Result cards
  resultCard:            "result-card",
  resultCardClean:       "result-card result-card--clean",
  resultCardFlagged:     "result-card result-card--flagged",

  // Stats
  statsGrid:             "stats-grid",
  statsCell:             "stats-cell",

  // Appearance tab
  skinOption:            "skin-option",
} as const;

// ── ID factories ──────────────────────────────────────────────────
export const IDS = {
  appShell:              "app-shell",
  appHeader:             "app-header",
  appTabBar:             "app-tab-bar",
  appContent:            "app-content",

  tabButton:  (tab: AppTab | "appearance") => \`tab-button-\${tab}\`,
  tabPanel:   (tab: AppTab | "appearance") => \`tab-panel-\${tab}\`,

  settingsCard: (name: string) => \`settings-card-\${name}\`,

  banner: (name: string) => \`banner-\${name}\`,

  // Action buttons
  actionStartProofreading: "action-start-proofreading",
  actionTestConnection:    "action-test-connection",
  actionExportJson:        "action-export-json",

  // Result cards
  resultCardClean:   (index: number) => \`result-card-clean-\${index}\`,
  resultCardFlagged: (index: number) => \`result-card-flagged-\${index}\`,

  // Stats
  statsPanel: "stats-panel",

  // Debug
  debugPanelConnection: "debug-panel-connection",
} as const;

// ── CSS query helpers (for tests / future e2e) ─────────────────────
export const QUERY = {
  tabButton:  (tab: AppTab | "appearance") => \`#\${IDS.tabButton(tab)}\`,
  tabPanel:   (tab: AppTab | "appearance") => \`#\${IDS.tabPanel(tab)}\`,
  settingsCard: (name: string) => \`#\${IDS.settingsCard(name)}\`,
} as const;

// ── Data attribute helpers ─────────────────────────────────────────
// Usage: <div {...DATA.panelHidden(false)} />
export const DATA = {
  panelHidden: (hidden: boolean) => ({ "data-panel-hidden": String(hidden) }),
  panelId:     (id: PanelId)     => ({ "data-panel-id": id }),
  checked:     (v: boolean)      => ({ "data-checked": String(v) }),
  selected:    (v: boolean)      => ({ "data-selected": String(v) }),
  skin:        (s: string)       => ({ "data-skin": s }),
  density:     (d: string)       => ({ "data-density": d }),
} as const;
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE: src/context/AppContext.tsx  [CHANGE]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INSTRUCTIONS:
//   The diff below shows the additions to AppContext.tsx.
//   Lines marked ADD: are new. Lines marked KEEP: already exist.
//   Do not delete any existing content unless shown with REMOVE:.
export const _appContextDiff = `
// DIFF — src/context/AppContext.tsx
// ─────────────────────────────────────────────────────────────────

// ADD: new import at top of file (after existing imports)
import type { UiState, PanelId } from "../types/uiConfig";
import { UI_DEFAULTS } from "../config/uiConfig";

// KEEP: existing AppTab type
export type AppTab = "config" | "input" | "output" | "playground";

// ADD: UiState actions to the AppAction union
// (merge into the existing AppAction type definition)
//
// ADD these variants:
//   | { type: "SET_UI_SKIN";     skin: UiState["skin"] }
//   | { type: "SET_UI_DENSITY";  density: UiState["density"] }
//   | { type: "SET_UI_DIR";      dir: UiState["dir"]["global"] }
//   | { type: "SET_UI_DIR_OVERRIDE"; tab: AppTab; dir: import("../types/uiConfig").UiDirOverride }
//   | { type: "SET_PANEL_HIDDEN"; panelId: PanelId; hidden: boolean }
//   | { type: "RESET_UI" }

// ADD: ui field to AppState interface
//   ui: UiState;

// ADD: initialState field
//   ui: UI_DEFAULTS,

// ADD: reducer cases (add inside the switch block)
/*
  case "SET_UI_SKIN":
    return { ...state, ui: { ...state.ui, skin: action.skin } };

  case "SET_UI_DENSITY":
    return { ...state, ui: { ...state.ui, density: action.density } };

  case "SET_UI_DIR":
    return {
      ...state,
      ui: { ...state.ui, dir: { ...state.ui.dir, global: action.dir } },
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
    return { ...state, ui: UI_DEFAULTS };
*/

// ─────────────────────────────────────────────────────────────────
// FULL UPDATED FILE (complete replacement — safe to apply directly)
// ─────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useReducer, type Dispatch } from "react";
import type { FeatureConfig } from "../types/featureConfig";
import type { MergedResult } from "../types/recommendation";
import type { ChunkProgress } from "../lib/proofreadingSession";
import { TESTING_DEFAULTS } from "../config/featureConfig";
import type { UiState, PanelId, UiDirOverride } from "../types/uiConfig";
import { UI_DEFAULTS } from "../config/uiConfig";

export type AppTab = "config" | "input" | "output" | "playground";

export interface AppState {
  // ── API credentials ────────────────────────────────────────────
  apiKey: string;
  // ── Feature config ─────────────────────────────────────────────
  cfg: FeatureConfig;
  // ── Input ──────────────────────────────────────────────────────
  inputText: string;
  inputFileName: string;
  // ── Session state ──────────────────────────────────────────────
  running: boolean;
  progress: ChunkProgress[];
  result: MergedResult | null;
  sessionError: string;
  // ── Navigation ─────────────────────────────────────────────────
  activeTab: AppTab;
  // ── Dev ────────────────────────────────────────────────────────
  promptOverride: string | undefined;
  // ── UI Appearance (new) ────────────────────────────────────────
  ui: UiState;
}

export type AppAction =
  | { type: "SET_API_KEY"; key: string }
  | { type: "SET_CFG"; cfg: Partial<FeatureConfig> }
  | { type: "SET_INPUT"; text: string; fileName?: string }
  | { type: "SESSION_START" }
  | { type: "SESSION_PROGRESS"; progress: ChunkProgress }
  | { type: "SESSION_DONE"; result: MergedResult }
  | { type: "SESSION_ERROR"; message: string }
  | { type: "SET_TAB"; tab: AppTab }
  | { type: "SET_PROMPT_OVERRIDE"; prompt: string | undefined }
  // UI appearance actions
  | { type: "SET_UI_SKIN";         skin: UiState["skin"] }
  | { type: "SET_UI_DENSITY";      density: UiState["density"] }
  | { type: "SET_UI_DIR";          dir: UiState["dir"]["global"] }
  | { type: "SET_UI_DIR_OVERRIDE"; tab: AppTab; dir: UiDirOverride }
  | { type: "SET_PANEL_HIDDEN";    panelId: PanelId; hidden: boolean }
  | { type: "RESET_UI" };

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_API_KEY":
      return { ...state, apiKey: action.key };
    case "SET_CFG":
      return { ...state, cfg: { ...state.cfg, ...action.cfg } };
    case "SET_INPUT":
      return { ...state, inputText: action.text, inputFileName: action.fileName ?? "" };
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
    // ── UI appearance ─────────────────────────────────────────────
    case "SET_UI_SKIN":
      return { ...state, ui: { ...state.ui, skin: action.skin } };
    case "SET_UI_DENSITY":
      return { ...state, ui: { ...state.ui, density: action.density } };
    case "SET_UI_DIR":
      return { ...state, ui: { ...state.ui, dir: { ...state.ui.dir, global: action.dir } } };
    case "SET_UI_DIR_OVERRIDE":
      return {
        ...state,
        ui: {
          ...state.ui,
          dir: {
            ...state.ui.dir,
            pageOverride: { ...state.ui.dir.pageOverride, [action.tab]: action.dir },
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
            [action.panelId]: { ...state.ui.panels[action.panelId], hidden: action.hidden },
          },
        },
      };
    case "RESET_UI":
      return { ...state, ui: UI_DEFAULTS };
    default:
      return state;
  }
}

const initialState: AppState = {
  apiKey: import.meta.env.VITE_COHERE_API_KEY ?? "",
  cfg: TESTING_DEFAULTS,
  inputText: "",
  inputFileName: "",
  running: false,
  progress: [],
  result: null,
  sessionError: "",
  activeTab: "config",
  promptOverride: undefined,
  ui: UI_DEFAULTS,
};

const StateCtx   = createContext<AppState>(initialState);
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
// FILE: src/index.css  [CHANGE — full replacement]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const _indexCss = `
/* src/index.css — Tailwind v4 */

@import "tailwindcss";

/* ─────────────────────────────────────────────────────────────────
   DESIGN TOKENS (@theme)
   These become CSS custom properties AND Tailwind utility names.
   e.g. --color-brand-900 → text-brand-900 / bg-brand-900

   Skin overrides work by re-declaring these vars under
   [data-skin="warm"] { } etc. in the Skin Overrides section.
───────────────────────────────────────────────────────────────── */
@theme {
  /* Brand palette — default (navy) */
  --color-brand-900:  #1c2b4a;   /* primary action, active tab */
  --color-brand-800:  #2d3f6b;   /* hover state */
  --color-brand-100:  #e8ecf4;   /* very light tint for backgrounds */

  /* Semantic surface colours */
  --color-surface:      #ffffff;
  --color-surface-soft: #f3f4f6;   /* bg-gray-100 equivalent */
  --color-border:       #e5e7eb;   /* gray-200 */
  --color-border-focus: var(--color-brand-900);

  /* Status colours */
  --color-warn-bg:      #fffbeb;   /* amber-50 */
  --color-warn-border:  #fcd34d;   /* amber-300 */
  --color-warn-text:    #92400e;   /* amber-800 */
  --color-error-bg:     #fef2f2;   /* red-50 */
  --color-error-border: #fca5a5;   /* red-300 */
  --color-error-text:   #dc2626;   /* red-600 */
  --color-ok-bg:        #f0fdf4;   /* green-50 */
  --color-ok-border:    #86efac;   /* green-300 */
  --color-ok-text:      #166534;   /* green-800 */

  /* Typography */
  --font-sans:   "Segoe UI", Tahoma, Arial, sans-serif;
  --font-arabic: "Arabic Typesetting", "Amiri", "Traditional Arabic", serif;

  /* Spacing rhythm */
  --card-padding-default: 1.25rem;   /* p-5 */
  --card-padding-compact: 0.75rem;   /* p-3 */
  --card-radius:          0.75rem;   /* rounded-xl */
  --card-shadow:          0 1px 3px 0 rgb(0 0 0 / 0.07),
                          0 1px 2px -1px rgb(0 0 0 / 0.07);
}

/* ─────────────────────────────────────────────────────────────────
   SKIN OVERRIDES
   Applied via data-skin attribute on #app-shell.
   Each skin only needs to override the tokens that differ.
───────────────────────────────────────────────────────────────── */
[data-skin="warm"] {
  --color-brand-900: #4a3828;
  --color-brand-800: #5e4a36;
  --color-brand-100: #f5efe9;
}

[data-skin="high-contrast"] {
  --color-brand-900: #000000;
  --color-brand-800: #1a1a1a;
  --color-brand-100: #f0f0f0;
  --color-border:    #000000;
}

/* ─────────────────────────────────────────────────────────────────
   DENSITY OVERRIDES
   Applied via data-density attribute on #app-shell.
───────────────────────────────────────────────────────────────── */
[data-density="compact"] {
  --card-padding-default: var(--card-padding-compact);
}

/* ─────────────────────────────────────────────────────────────────
   PANEL VISIBILITY
   Driven by data-panel-hidden attribute set from UiState.panels.
   Using display:none here (not Tailwind hidden class) because:
   - It works across all skins without a safelist
   - data-panel-hidden is always present; we toggle its value only
───────────────────────────────────────────────────────────────── */
[data-panel-hidden="true"] {
  display: none;
}

/* ─────────────────────────────────────────────────────────────────
   BASE LAYER
───────────────────────────────────────────────────────────────── */
@layer base {
  html {
    font-family: var(--font-sans);
  }

  /* Consistent focus ring — WCAG 2.4.7 */
  :focus-visible {
    outline: 2px solid var(--color-brand-900);
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* RTL inputs follow the dir attribute on their ancestor */
  [dir="rtl"] textarea,
  [dir="rtl"] input[type="text"],
  [dir="rtl"] input[type="password"],
  [dir="rtl"] input[type="number"] {
    text-align: right;
  }
}

/* ─────────────────────────────────────────────────────────────────
   COMPONENT LAYER — semantic class definitions
   These are the design system primitives that components reference
   via CLS.* from uiSelectors.ts.
   Tailwind utilities can still be composed on top in JSX.
───────────────────────────────────────────────────────────────── */
@layer components {

  /* ── Card shell ──────────────────────────────────────────────── */
  .settings-card {
    border-radius: var(--card-radius);
    background-color: var(--color-surface);
    padding: var(--card-padding-default);
    box-shadow: var(--card-shadow);
  }

  .settings-card--compact {
    padding: var(--card-padding-compact);
  }

  /* ── Card heading ─────────────────────────────────────────────── */
  .settings-card__heading {
    font-size: 0.9375rem;       /* ~15px — between sm and base */
    font-weight: 600;
    color: #1f2937;             /* gray-800 */
    padding-bottom: 0.5rem;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border);
  }

  /* ── Field primitives ─────────────────────────────────────────── */
  .field-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #4b5563;   /* gray-600 */
  }

  .field-caption {
    font-size: 0.75rem;
    color: #9ca3af;   /* gray-400 */
    margin-top: 0.25rem;
    line-height: 1.4;
  }

  .field-input,
  .field-select,
  .field-textarea {
    width: 100%;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;   /* rounded-lg */
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 150ms ease;
    background-color: var(--color-surface);
  }

  .field-input:focus,
  .field-select:focus,
  .field-textarea:focus {
    border-color: var(--color-border-focus);
  }

  .field-range {
    width: 100%;
    accent-color: var(--color-brand-900);
  }

  /* ── Toggle switch (accessible) ───────────────────────────────── */
  /*
   * Usage in JSX:
   *   <button
   *     role="switch"
   *     aria-checked={value}
   *     data-checked={String(value)}
   *     className="toggle-switch"
   *     onClick={...}
   *   >
   *     <span className="toggle-switch__track">
   *       <span className="toggle-switch__thumb" />
   *     </span>
   *     <span className="sr-only">{label}</span>
   *   </button>
   */
  .toggle-switch {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
  }

  .toggle-switch__track {
    position: relative;
    width: 2.75rem;    /* w-11 */
    height: 1.5rem;    /* h-6 */
    border-radius: 9999px;
    background-color: #d1d5db;  /* gray-300 = off state */
    transition: background-color 200ms ease;
    flex-shrink: 0;
  }

  /* ON state: button has data-checked="true" */
  .toggle-switch[data-checked="true"] .toggle-switch__track {
    background-color: var(--color-brand-900);
  }

  .toggle-switch__thumb {
    position: absolute;
    top: 0.25rem;     /* top-1 */
    left: 0.25rem;    /* left-1 */
    width: 1rem;      /* w-4 */
    height: 1rem;     /* h-4 */
    border-radius: 9999px;
    background-color: white;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
    transition: transform 200ms ease;
  }

  .toggle-switch[data-checked="true"] .toggle-switch__thumb {
    transform: translateX(1.25rem);  /* slide right */
  }

  /* ── Segmented buttons ──────────────────────────────────────────── */
  .segment-group {
    display: flex;
    gap: 0.5rem;
  }

  .segment-button {
    flex: 1;
    padding: 0.375rem 0.5rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: #6b7280;   /* gray-500 */
    cursor: pointer;
    transition: all 150ms ease;
  }

  .segment-button[data-selected="true"] {
    background-color: var(--color-brand-900);
    color: white;
    border-color: var(--color-brand-900);
  }

  .segment-button:hover:not([data-selected="true"]) {
    border-color: var(--color-brand-900);
  }

  /* ── Status banners ───────────────────────────────────────────── */
  .status-banner {
    border-radius: 0.5rem;
    padding: 1rem;
    font-size: 0.875rem;
    border-width: 1px;
    border-style: solid;
  }

  .status-banner--warn {
    background-color: var(--color-warn-bg);
    border-color: var(--color-warn-border);
    color: var(--color-warn-text);
  }

  .status-banner--error {
    background-color: var(--color-error-bg);
    border-color: var(--color-error-border);
    color: var(--color-error-text);
  }

  .status-banner--ok {
    background-color: var(--color-ok-bg);
    border-color: var(--color-ok-border);
    color: var(--color-ok-text);
  }

  /* ── Action buttons ───────────────────────────────────────────── */
  .action-button--primary {
    width: 100%;
    padding: 0.875rem;
    background-color: var(--color-brand-900);
    color: white;
    font-size: 1rem;
    font-weight: 700;
    border-radius: var(--card-radius);
    border: none;
    cursor: pointer;
    transition: background-color 150ms ease;
  }

  .action-button--primary:hover:not(:disabled) {
    background-color: var(--color-brand-800);
  }

  .action-button--primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .action-button--secondary {
    padding: 0.5rem 1rem;
    background-color: var(--color-brand-900);
    color: white;
    font-size: 0.875rem;
    font-weight: 600;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    transition: background-color 150ms ease;
  }

  .action-button--secondary:hover:not(:disabled) {
    background-color: var(--color-brand-800);
  }

  .action-button--secondary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .action-button--ghost {
    background: none;
    border: none;
    padding: 0;
    font-size: 0.75rem;
    color: #9ca3af;   /* gray-400 */
    cursor: pointer;
    font-weight: 600;
    transition: color 150ms ease;
  }

  .action-button--ghost:hover {
    color: #4b5563;   /* gray-600 */
  }

  /* ── Tab navigation ────────────────────────────────────────────── */
  .app-tab-bar {
    display: flex;
    background-color: var(--color-surface);
    border-radius: 0.75rem 0.75rem 0 0;
    box-shadow: var(--card-shadow);
    border-bottom: 1px solid var(--color-border);
    overflow: hidden;
  }

  .tab-button {
    flex: 1;
    padding: 0.625rem 0.25rem;   /* reduced from py-3 → py-2.5 */
    font-size: 0.8125rem;        /* 13px — up from xs/12px */
    font-weight: 600;
    border: none;
    border-bottom: 2px solid transparent;
    background: none;
    color: #9ca3af;   /* gray-400 inactive */
    cursor: pointer;
    transition: color 150ms ease, border-color 150ms ease;
    position: relative;
  }

  .tab-button:hover:not(.tab-button--active) {
    color: #6b7280;   /* gray-500 */
  }

  .tab-button--active {
    border-bottom-color: var(--color-brand-900);
    color: var(--color-brand-900);
  }

  /* ── Result cards ─────────────────────────────────────────────── */
  .result-card {
    border-radius: 0.5rem;
    border: 1px solid var(--color-border);
    padding: 1rem;
    margin-bottom: 0.75rem;
    background-color: var(--color-surface);
  }

  .result-card--flagged {
    background-color: var(--color-warn-bg);
    border-color: var(--color-warn-border);
  }

  /* ── Stats grid ───────────────────────────────────────────────── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .stats-cell {
    background-color: var(--color-surface-soft);
    border-radius: 0.5rem;
    padding: 0.75rem;
    text-align: center;
  }

  /* ── Arabic text utility (preserved + enhanced) ───────────────── */
  .arabic-text {
    font-family: var(--font-arabic);
    font-size: 1.1rem;    /* slightly tighter than original 1.2rem */
    line-height: 1.9;
    direction: rtl;
    unicode-bidi: embed;
  }

  /* ── Skin swatch (used in UiTab) ─────────────────────────────── */
  .skin-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    border-radius: 0.5rem;
    border: 2px solid transparent;
    cursor: pointer;
    background: none;
    width: 100%;
    text-align: left;
    transition: border-color 150ms ease;
  }

  .skin-option[data-selected="true"] {
    border-color: var(--color-brand-900);
    background-color: var(--color-brand-100);
  }

  .skin-option:hover:not([data-selected="true"]) {
    border-color: var(--color-border);
    background-color: var(--color-surface-soft);
  }

  .skin-option__swatch {
    width: 2rem;
    height: 2rem;
    border-radius: 0.375rem;
    flex-shrink: 0;
  }
}

/* ─────────────────────────────────────────────────────────────────
   UTILITIES LAYER — single-purpose additions
───────────────────────────────────────────────────────────────── */
@layer utilities {
  /* Screen-reader-only text */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
}
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE: tailwind.config.ts  [CHANGE — retire v3 shape]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const _tailwindConfig = `
// tailwind.config.ts
// ─────────────────────────────────────────────────────────────────
// Tailwind v4 does NOT use this file for tokens (those live in
// @theme {} in index.css). This file is kept only for the
// hoverOnlyWhenSupported future flag, which is still valid in v4.
//
// The "content" array is not needed in v4 — the vite plugin
// (@tailwindcss/vite) handles content detection automatically via
// the module graph. Keeping it causes no harm but it is inert.
// ─────────────────────────────────────────────────────────────────
import type { Config } from "tailwindcss";

export default {
  // v4: content scanning is handled by @tailwindcss/vite — safe to omit.
  // Kept here as a no-op comment anchor for future explicit overrides.
  future: { hoverOnlyWhenSupported: true },
} satisfies Config;
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE: src/App.tsx  [CHANGE — semantic ids, dir wiring, Appearance tab]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const _appTsx = `
// src/App.tsx
import { AppProvider, useAppState, useAppDispatch, type AppTab } from "./context/AppContext";
import { ConfigTab }     from "./components/tabs/ConfigTab";
import { InputTab }      from "./components/tabs/InputTab";
import { OutputTab }     from "./components/tabs/OutputTab";
import { PlaygroundTab } from "./components/tabs/PlaygroundTab";
import { UiTab }         from "./components/tabs/UiTab";
import { CLS, IDS, DATA } from "./lib/uiSelectors";

const IS_DEV = import.meta.env.DEV;

// AppTab union is "config"|"input"|"output"|"playground".
// "appearance" is handled locally here as a display-only tab type
// so the AppTab union stays clean for feature logic.
type DisplayTab = AppTab | "appearance";

const TABS: Array<{ id: DisplayTab; label: string; devOnly?: boolean }> = [
  { id: "config",      label: "⚙ Config" },
  { id: "input",       label: "✏ Input" },
  { id: "output",      label: "📄 Output" },
  { id: "appearance",  label: "🎨 Appearance", devOnly: true },
  { id: "playground",  label: "🛠 Playground",  devOnly: true },
];

function Shell() {
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const { activeTab, result, ui } = state;

  // Local state for the appearance tab (not an AppTab in context)
  const [displayTab, setDisplayTab] = React.useState<DisplayTab>(activeTab);

  const visibleTabs = TABS.filter(t => !t.devOnly || IS_DEV);

  const handleTabClick = (id: DisplayTab) => {
    setDisplayTab(id);
    // Only dispatch to context for real AppTabs
    if (id !== "appearance") {
      dispatch({ type: "SET_TAB", tab: id as AppTab });
    }
  };

  // Resolve text direction for the active tab content.
  // Falls back: pageOverride[tab] → global → "ltr"
  const resolveDir = (tab: DisplayTab): "ltr" | "rtl" => {
    if (tab === "appearance" || tab === "playground") return "ltr";
    const override = ui.dir.pageOverride[tab as AppTab];
    if (override && override !== "inherit") return override;
    return ui.dir.global;
  };

  const activeDir = resolveDir(displayTab);

  return (
    <div
      id={IDS.appShell}
      className={\`\${CLS.appShell} min-h-screen bg-[--color-surface-soft] font-sans\`}
      {...DATA.skin(ui.skin)}
      {...DATA.density(ui.density)}
    >
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div id={IDS.appHeader} className={\`\${CLS.appHeader} text-center mb-6\`}>
          <h1 className="text-2xl font-extrabold text-[--color-brand-900] tracking-tight">
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
        <div id={IDS.appTabBar} className={CLS.appTabBar}>
          {visibleTabs.map(tab => {
            const active    = displayTab === tab.id;
            const hasResult = tab.id === "output" && result &&
                              result.clean.length + result.flagged.length > 0;
            return (
              <button
                key={tab.id}
                id={IDS.tabButton(tab.id as AppTab | "appearance")}
                className={\`\${CLS.tabButton} \${active ? CLS.tabButtonActive : ""}\`}
                onClick={() => handleTabClick(tab.id)}
                aria-selected={active}
                role="tab"
              >
                {tab.label}
                {hasResult && !active && (
                  <span
                    className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"
                    aria-label="has results"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content — dir applied here for whole-panel RTL */}
        <div
          id={IDS.appContent}
          className={\`\${CLS.appContent} bg-[--color-surface-soft] rounded-b-xl pt-4\`}
          dir={activeDir}
        >
          {displayTab === "config"     && <ConfigTab />}
          {displayTab === "input"      && <InputTab />}
          {displayTab === "output"     && <OutputTab />}
          {displayTab === "appearance" && IS_DEV && <UiTab />}
          {displayTab === "playground" && IS_DEV && <PlaygroundTab />}
        </div>

      </div>
    </div>
  );
}

// Need React imported for useState in Shell
import React from "react";

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE: src/components/tabs/UiTab.tsx  [NEW]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const _uiTabTsx = `
// src/components/tabs/UiTab.tsx
import { useAppState, useAppDispatch, type AppTab } from "../../context/AppContext";
import { SKIN_OPTIONS, DENSITY_OPTIONS, UI_DEFAULTS } from "../../config/uiConfig";
import { CLS, IDS, DATA } from "../../lib/uiSelectors";
import type { PanelId, UiDirOverride } from "../../types/uiConfig";

const DIR_OPTIONS: Array<{ id: UiDirOverride; label: string }> = [
  { id: "ltr",     label: "LTR — Left to Right" },
  { id: "rtl",     label: "RTL — Right to Left" },
  { id: "inherit", label: "Inherit global" },
];

const OVERRIDEABLE_TABS: Array<{ id: AppTab; label: string }> = [
  { id: "config",  label: "Config" },
  { id: "input",   label: "Input" },
  { id: "output",  label: "Output" },
];

export function UiTab() {
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const { ui }   = state;

  // Group panels by tab for the visibility section
  const configPanels  = (Object.entries(ui.panels) as [PanelId, (typeof ui.panels)[PanelId]][])
    .filter(([, v]) => v.tab === "config");
  const outputPanels  = (Object.entries(ui.panels) as [PanelId, (typeof ui.panels)[PanelId]][])
    .filter(([, v]) => v.tab === "output");

  return (
    <div className="space-y-4" id="tab-panel-appearance">

      {/* ── Skin ──────────────────────────────────────────────── */}
      <div
        id={IDS.settingsCard("skin")}
        className={CLS.settingsCard}
        {...DATA.panelId("panel-api-key" /* placeholder — no panel id for skin yet */)}
      >
        <h3 className="settings-card__heading">
          <span aria-hidden="true">🎨 </span>Color Skin
        </h3>
        <div className="space-y-2">
          {SKIN_OPTIONS.map(opt => (
            <button
              key={opt.id}
              className={CLS.skinOption}
              {...DATA.selected(ui.skin === opt.id)}
              onClick={() => dispatch({ type: "SET_UI_SKIN", skin: opt.id })}
            >
              <span className={\`skin-option__swatch \${opt.swatchBg}\`} aria-hidden="true" />
              <span className="flex flex-col items-start">
                <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                <span className="field-caption">{opt.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Density ───────────────────────────────────────────── */}
      <div id={IDS.settingsCard("density")} className={CLS.settingsCard}>
        <h3 className="settings-card__heading">
          <span aria-hidden="true">⬜ </span>Layout Density
        </h3>
        <div className={CLS.segmentGroup}>
          {DENSITY_OPTIONS.map(opt => (
            <button
              key={opt.id}
              className={CLS.segmentButton}
              {...DATA.selected(ui.density === opt.id)}
              onClick={() => dispatch({ type: "SET_UI_DENSITY", density: opt.id })}
              title={opt.description}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="field-caption mt-2">
          {DENSITY_OPTIONS.find(o => o.id === ui.density)?.description}
        </p>
      </div>

      {/* ── Text Direction ────────────────────────────────────── */}
      <div id={IDS.settingsCard("direction")} className={CLS.settingsCard}>
        <h3 className="settings-card__heading">
          <span aria-hidden="true">↔ </span>Text Direction
        </h3>

        {/* Global toggle */}
        <div className="mb-4">
          <p className="field-label mb-1">Global direction</p>
          <p className="field-caption mb-2">
            Applies to the entire shell. Per-tab overrides below can refine this.
          </p>
          <div className={CLS.segmentGroup}>
            {(["ltr", "rtl"] as const).map(dir => (
              <button
                key={dir}
                className={CLS.segmentButton}
                {...DATA.selected(ui.dir.global === dir)}
                onClick={() => dispatch({ type: "SET_UI_DIR", dir })}
              >
                {dir === "ltr" ? "LTR ←" : "RTL →"}
              </button>
            ))}
          </div>
        </div>

        {/* Per-tab overrides */}
        <div className="space-y-3">
          <p className="field-label">Per-tab overrides</p>
          {OVERRIDEABLE_TABS.map(tab => {
            const current = ui.dir.pageOverride[tab.id] ?? "inherit";
            return (
              <div key={tab.id} className="flex items-center gap-3 flex-wrap">
                <span className="field-label w-16 shrink-0">{tab.label}</span>
                <div className={\`\${CLS.segmentGroup} flex-1\`}>
                  {DIR_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      className={CLS.segmentButton}
                      {...DATA.selected(current === opt.id)}
                      onClick={() =>
                        dispatch({ type: "SET_UI_DIR_OVERRIDE", tab: tab.id, dir: opt.id })
                      }
                    >
                      {opt.label.split(" — ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Panel Visibility ──────────────────────────────────── */}
      <div id={IDS.settingsCard("panels")} className={CLS.settingsCard}>
        <h3 className="settings-card__heading">
          <span aria-hidden="true">👁 </span>Panel Visibility
        </h3>

        {/* Config panels */}
        <p className="field-label mb-2">Config tab</p>
        <div className="space-y-2 mb-4">
          {configPanels.map(([panelId, panel]) => (
            <PanelToggleRow
              key={panelId}
              panelId={panelId as PanelId}
              label={panel.label}
              hidden={panel.hidden}
              onToggle={hidden => dispatch({ type: "SET_PANEL_HIDDEN", panelId: panelId as PanelId, hidden })}
            />
          ))}
        </div>

        {/* Output panels */}
        <p className="field-label mb-2">Output tab</p>
        <div className="space-y-2">
          {outputPanels.map(([panelId, panel]) => (
            <PanelToggleRow
              key={panelId}
              panelId={panelId as PanelId}
              label={panel.label}
              hidden={panel.hidden}
              onToggle={hidden => dispatch({ type: "SET_PANEL_HIDDEN", panelId: panelId as PanelId, hidden })}
            />
          ))}
        </div>
      </div>

      {/* ── Reset ─────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          className={CLS.actionGhost}
          onClick={() => dispatch({ type: "RESET_UI" })}
        >
          ↺ Reset appearance to defaults
        </button>
      </div>

    </div>
  );
}

// ── Sub-component: PanelToggleRow ─────────────────────────────────
function PanelToggleRow({
  panelId, label, hidden, onToggle,
}: {
  panelId: PanelId;
  label: string;
  hidden: boolean;
  onToggle: (hidden: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        role="switch"
        aria-checked={!hidden}
        aria-label={\`\${hidden ? "Show" : "Hide"} \${label}\`}
        {...DATA.checked(!hidden)}
        className={CLS.toggleSwitch}
        onClick={() => onToggle(!hidden)}
      >
        <span className={CLS.toggleSwitchTrack}>
          <span className={CLS.toggleSwitchThumb} />
        </span>
      </button>
    </label>
  );
}
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE: src/components/tabs/ConfigTab.tsx  [CHANGE — selectors + a11y]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// This is a full replacement. Core logic is unchanged; changes are:
//   - All cards get id + data-panel-id + data-panel-hidden
//   - Card headings get settings-card__heading + aria-hidden emoji
//   - Hardcoded #1c2b4a → text-[--color-brand-900] / border-[--color-brand-900]
//   - All divs-acting-as-toggle replaced with accessible <button role="switch">
//   - All segment button groups use segment-group / segment-button + data-selected
//   - field-label / field-caption / field-input / field-range classes added
export const _configTabTsx = `
// src/components/tabs/ConfigTab.tsx
import { useAppState, useAppDispatch } from "../../context/AppContext";
import { TESTING_DEFAULTS, PRODUCTION_DEFAULTS, AVAILABLE_MODELS } from "../../config/featureConfig";
import { ConnectionPanel } from "../shared/ConnectionPanel";
import { UsageMonitor }    from "../shared/UsageMonitor";
import type { FeatureConfig, CustomInstructionsMode } from "../../types/featureConfig";
import { CLS, IDS, DATA } from "../../lib/uiSelectors";

export function ConfigTab() {
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const { cfg, apiKey, ui } = state;

  const set = (patch: Partial<FeatureConfig>) => dispatch({ type: "SET_CFG", cfg: patch });

  const switchTier = (tier: "testing" | "production") => {
    const defaults = tier === "testing" ? TESTING_DEFAULTS : PRODUCTION_DEFAULTS;
    dispatch({ type: "SET_CFG", cfg: defaults });
  };

  const panelProps = (panelId: Parameters<typeof DATA.panelId>[0]) => ({
    ...DATA.panelId(panelId),
    ...DATA.panelHidden(ui.panels[panelId]?.hidden ?? false),
  });

  return (
    <div className="space-y-4">

      {/* ── API Key ──────────────────────────────────────────── */}
      <div
        id={IDS.settingsCard("api-key")}
        className={CLS.settingsCard}
        {...panelProps("panel-api-key")}
      >
        <h3 className="settings-card__heading">
          <span aria-hidden="true">🔑 </span>API Key
        </h3>
        <p className={\`\${CLS.fieldCaption} text-red-500 mb-2\`}>
          ⚠ Preferred: set <code>COHERE_API_KEY</code> on the local proxy.
          This field is a client-side fallback for dev/testing only.
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={e => dispatch({ type: "SET_API_KEY", key: e.target.value })}
          placeholder="co-..."
          className={CLS.fieldInput}
        />
      </div>

      {/* ── Connection (rendered by shared component) ─────────── */}
      <ConnectionPanel />

      {/* ── Tier ─────────────────────────────────────────────── */}
      <div
        id={IDS.settingsCard("tier")}
        className={CLS.settingsCard}
        {...panelProps("panel-tier")}
      >
        <h3 className="settings-card__heading">
          <span aria-hidden="true">⚙ </span>Plan Tier
        </h3>
        <div className={CLS.segmentGroup}>
          {(["testing", "production"] as const).map(tier => (
            <button
              key={tier}
              className={CLS.segmentButton}
              {...DATA.selected(cfg.tier === tier)}
              onClick={() => switchTier(tier)}
            >
              {tier === "testing" ? "🔬 Testing" : "🚀 Production"}
            </button>
          ))}
        </div>
        {cfg.tier === "production" && (
          <p className={\`\${CLS.fieldCaption} text-amber-600 mt-2\`}>
            ⚠ Command A+ production access requires contacting Cohere sales — it is not self-serve.
          </p>
        )}
      </div>

      {/* ── Model ────────────────────────────────────────────── */}
      <div
        id={IDS.settingsCard("model")}
        className={CLS.settingsCard}
        {...panelProps("panel-model")}
      >
        <h3 className="settings-card__heading">
          <span aria-hidden="true">🤖 </span>Model
        </h3>
        <select
          value={cfg.modelId}
          onChange={e => set({ modelId: e.target.value as FeatureConfig["modelId"] })}
          className={CLS.fieldSelect}
        >
          {AVAILABLE_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* ── Inference Parameters ─────────────────────────────── */}
      <div
        id={IDS.settingsCard("inference")}
        className={CLS.settingsCard}
        {...panelProps("panel-inference")}
      >
        <h3 className="settings-card__heading">
          <span aria-hidden="true">🌡 </span>Inference Parameters
        </h3>
        <div className="space-y-4">

          {/* Temperature */}
          <div>
            <div className="flex justify-between mb-1">
              <label htmlFor="param-temperature" className={CLS.fieldLabel}>Temperature</label>
              <span className="text-sm font-bold text-[--color-brand-900]">
                {cfg.temperature.toFixed(2)}
              </span>
            </div>
            <p className={CLS.fieldCaption}>
              Values below 0.4 have been empirically observed to degrade output with this model.
            </p>
            <input
              id="param-temperature"
              type="range" min={0} max={1} step={0.05} value={cfg.temperature}
              onChange={e => set({ temperature: Number(e.target.value) })}
              className={\`\${CLS.fieldRange} mt-1\`}
            />
          </div>

          {/* Seed */}
          <div>
            <div className="flex justify-between mb-1">
              <label htmlFor="param-seed" className={CLS.fieldLabel}>Seed</label>
              <span className="text-sm font-bold text-[--color-brand-900]">{cfg.seed}</span>
            </div>
            <input
              id="param-seed"
              type="number" value={cfg.seed}
              onChange={e => set({ seed: parseInt(e.target.value, 10) || 42 })}
              className={CLS.fieldInput}
            />
          </div>

          {/* Thinking toggle */}
          <div>
            <p className="field-label mb-1">Thinking</p>
            <button
              role="switch"
              aria-checked={!cfg.thinkingDisabled}
              aria-label="Toggle model thinking"
              {...DATA.checked(!cfg.thinkingDisabled)}
              className={CLS.toggleSwitch}
              onClick={() => set({ thinkingDisabled: !cfg.thinkingDisabled })}
            >
              <span className={CLS.toggleSwitchTrack}>
                <span className={CLS.toggleSwitchThumb} />
              </span>
              <span className="text-sm font-semibold text-gray-700">
                {cfg.thinkingDisabled ? "Send thinking: disabled" : "Allow model thinking"}
              </span>
            </button>
            <p className={CLS.fieldCaption}>
              This setting is sent to the model and is honored by the connection test.
            </p>
          </div>

          {/* Max chunk chars */}
          <div>
            <div className="flex justify-between mb-1">
              <label htmlFor="param-chunk" className={CLS.fieldLabel}>Max Chunk Characters</label>
              <span className="text-sm font-bold text-[--color-brand-900]">
                {cfg.maxChunkChars.toLocaleString()}
              </span>
            </div>
            <input
              id="param-chunk"
              type="range" min={500} max={8000} step={100} value={cfg.maxChunkChars}
              onChange={e => set({ maxChunkChars: Number(e.target.value) })}
              className={CLS.fieldRange}
            />
          </div>
        </div>
      </div>

      {/* ── Multi-Turn (compact card) ─────────────────────────── */}
      <div
        id={IDS.settingsCard("multiturn")}
        className={CLS.settingsCardCompact}
        {...panelProps("panel-multiturn")}
      >
        <h3 className="settings-card__heading">
          <span aria-hidden="true">🔄 </span>Multi-Turn Chunking
        </h3>
        <button
          role="switch"
          aria-checked={cfg.multiTurn}
          aria-label="Toggle multi-turn chunking"
          {...DATA.checked(cfg.multiTurn)}
          className={CLS.toggleSwitch}
          onClick={() => set({ multiTurn: !cfg.multiTurn })}
        >
          <span className={CLS.toggleSwitchTrack}>
            <span className={CLS.toggleSwitchThumb} />
          </span>
          <span className="text-sm font-semibold text-gray-700">
            {cfg.multiTurn
              ? "Multi-turn (chunks as conversation turns)"
              : "Stateless (independent calls per chunk)"}
          </span>
        </button>
        <p className={CLS.fieldCaption}>
          Multi-turn sends the system prompt once and appends chunks.
          Stateless re-sends the full system prompt per chunk.
        </p>
      </div>

      {/* ── Custom Instructions ───────────────────────────────── */}
      <div
        id={IDS.settingsCard("instructions")}
        className={CLS.settingsCard}
        {...panelProps("panel-instructions")}
      >
        <h3 className="settings-card__heading">
          <span aria-hidden="true">📋 </span>Custom Instructions
        </h3>
        <div className={\`\${CLS.segmentGroup} mb-3\`}>
          {(["none", "additive", "override"] as CustomInstructionsMode[]).map(mode => (
            <button
              key={mode}
              className={CLS.segmentButton}
              {...DATA.selected(cfg.customInstructionsMode === mode)}
              onClick={() => set({ customInstructionsMode: mode })}
            >
              {mode === "none" ? "None" : mode === "additive" ? "Additive" : "Override"}
            </button>
          ))}
        </div>
        {cfg.customInstructionsMode === "override" && (
          <p className={\`\${CLS.fieldCaption} text-amber-600 mb-2\`}>
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
            className={\`\${CLS.fieldTextarea} arabic-text resize-y\`}
          />
        )}
      </div>

      <UsageMonitor />

    </div>
  );
}
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE: src/components/tabs/InputTab.tsx  [CHANGE — selectors + a11y]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const _inputTabTsx = `
// src/components/tabs/InputTab.tsx
import { useRef } from "react";
import { useAppState, useAppDispatch } from "../../context/AppContext";
import { runProofreadingSession } from "../../lib/proofreadingSession";
import { ChunkProgressList } from "../shared/ChunkProgressList";
import { CLS, IDS } from "../../lib/uiSelectors";

export function InputTab() {
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const fileRef  = useRef<HTMLInputElement>(null);

  const { inputText, inputFileName, running, progress, sessionError, apiKey, cfg, promptOverride } = state;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev =>
      dispatch({ type: "SET_INPUT", text: String(ev.target?.result ?? ""), fileName: file.name });
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    dispatch({ type: "SESSION_START" });
    try {
      const result = await runProofreadingSession({
        text: inputText, apiKey, cfg, promptOverride,
        onProgress: p => dispatch({ type: "SESSION_PROGRESS", progress: p }),
      });
      dispatch({ type: "SESSION_DONE",  result: result.merged });
      dispatch({ type: "SET_TAB",       tab: "output" });
    } catch (e: unknown) {
      dispatch({ type: "SESSION_ERROR", message: String((e as Error).message) });
    }
  };

  const canSubmit = !!inputText.trim() && !running;

  return (
    <div className="space-y-4">

      {/* No API key warning */}
      {!apiKey && (
        <div id={IDS.banner("no-api-key")} className={CLS.statusBannerWarn}>
          <span aria-hidden="true">⚠ </span>
          No client-side API key is set. That is fine if the local proxy
          has <code>COHERE_API_KEY</code> configured server-side.
        </div>
      )}

      {/* Text input card */}
      <div
        id={IDS.settingsCard("arabic-input")}
        className={CLS.settingsCard}
      >
        <h3 className="settings-card__heading">
          <span aria-hidden="true">✏ </span>Arabic Text
        </h3>
        <textarea
          id="input-arabic-text"
          dir="rtl"
          value={inputText}
          onChange={e => dispatch({ type: "SET_INPUT", text: e.target.value })}
          placeholder="أدخل النص العربي هنا للتدقيق اللغوي…"
          rows={10}
          aria-label="Arabic text to proofread"
          className={\`\${CLS.fieldTextarea} arabic-text resize-y\`}
        />
        <div className="flex items-center gap-3 mt-2 flex-wrap" dir="ltr">
          <span className={\`\${CLS.fieldCaption} m-0\`}>
            {inputText.length.toLocaleString()} characters
          </span>
          <button
            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5
                       hover:border-gray-500 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            Upload .txt
          </button>
          {inputFileName && (
            <span className="text-xs text-green-600">✓ {inputFileName}</span>
          )}
          <button
            className={CLS.actionGhost}
            onClick={() => dispatch({ type: "SET_INPUT", text: "" })}
          >
            Clear
          </button>
        </div>
        <input
          type="file"
          accept=".txt,.text"
          ref={fileRef}
          onChange={handleFile}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Session error */}
      {sessionError && (
        <div id={IDS.banner("session-error")} className={CLS.statusBannerError}>
          <span aria-hidden="true">⚠ </span>{sessionError}
        </div>
      )}

      {/* Primary action */}
      <button
        id={IDS.actionStartProofreading}
        className={CLS.actionPrimary}
        onClick={handleSubmit}
        disabled={!canSubmit}
        aria-busy={running}
      >
        {running ? "⏳ Proofreading in progress…" : "▶ Start Proofreading"}
      </button>

      <ChunkProgressList progress={progress} />

    </div>
  );
}
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE: src/components/tabs/OutputTab.tsx  [CHANGE — selectors + a11y]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const _outputTabTsx = `
// src/components/tabs/OutputTab.tsx
import { useState } from "react";
import { useAppState } from "../../context/AppContext";
import type { Recommendation } from "../../types/recommendation";
import { CLS, IDS, DATA } from "../../lib/uiSelectors";

function RecommendationCard({
  rec, index, flagged,
}: { rec: Recommendation; index: number; flagged: boolean }) {
  const cardId = flagged
    ? IDS.resultCardFlagged(index)
    : IDS.resultCardClean(index);

  return (
    <div
      id={cardId}
      className={flagged ? CLS.resultCardFlagged : CLS.resultCardClean}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-gray-400" aria-hidden="true">#{index + 1}</span>
        {flagged && (
          <span className="text-xs bg-amber-200 text-amber-800 rounded px-2 py-0.5 font-semibold">
            ⚠ Needs review — partial fix detected
          </span>
        )}
      </div>
      {/* Use a definition list for accessible key-value pairs */}
      <dl className="space-y-2 text-sm" dir="rtl">
        <div>
          <dt className="text-xs font-bold text-gray-500 mb-0.5">العبارة (Anchor)</dt>
          <dd className="arabic-text bg-red-50 rounded px-2 py-1 text-red-800 border border-red-100">
            {rec["العبارة"]}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-gray-500 mb-0.5">الخطأ (Error)</dt>
          <dd className="arabic-text bg-gray-50 rounded px-2 py-1 text-gray-700">
            {rec["الخطأ"]}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-gray-500 mb-0.5">التصحيح (Correction)</dt>
          <dd className="arabic-text bg-green-50 rounded px-2 py-1 text-green-800 border border-green-100">
            {rec["التصحيح"]}
          </dd>
        </div>
        {rec._conflictsWith && (
          <div>
            <dt className="sr-only">Conflict warning</dt>
            <dd className="text-xs text-amber-600">
              Conflict: correction still contains anchor from another entry: "{rec._conflictsWith}"
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export function OutputTab() {
  const { result, ui } = useAppState();
  const [showFlagged, setShowFlagged] = useState(true);

  if (!result) {
    return (
      <div className={\`\${CLS.settingsCard} text-center py-10 text-gray-400\`}>
        <div className="text-4xl mb-3" aria-hidden="true">📄</div>
        <p>Results will appear here after proofreading completes.</p>
      </div>
    );
  }

  const { clean, flagged, stats } = result;

  const handleExport = () => {
    const payload = {
      number_of_errors: String(clean.length + flagged.length),
      clean_recommendations: clean,
      flagged_recommendations: flagged,
      stats,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), {
      href: url, download: "proofreading_result.json",
    });
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const statCells = [
    { label: "Total",   value: stats.total,  accent: false },
    { label: "Clean",   value: stats.clean,  accent: true  },
    { label: "Flagged", value: stats.leaked, accent: false },
    { label: "No-op",   value: stats.noOp,   accent: false },
  ];

  return (
    <div className="space-y-4">

      {/* Stats bar */}
      <div
        id={IDS.statsPanel}
        className={CLS.settingsCard}
        {...DATA.panelId("panel-stats")}
        {...DATA.panelHidden(ui.panels["panel-stats"]?.hidden ?? false)}
      >
        {/* Accessible stats using dl */}
        <dl id="stats-grid" className={CLS.statsGrid} aria-label="Proofreading statistics">
          {statCells.map(({ label, value, accent }) => (
            <div key={label} className={CLS.statsCell}>
              <dt className="field-caption mb-1">{label}</dt>
              <dd className={\`text-xl font-bold \${accent ? "text-green-600" : "text-[--color-brand-900]"}\`}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <button
          id={IDS.actionExportJson}
          className={CLS.actionSecondary}
          onClick={handleExport}
        >
          ⬇ Export JSON
        </button>
      </div>

      {/* Clean results */}
      <div
        id={IDS.settingsCard("clean-results")}
        className={CLS.settingsCard}
        {...DATA.panelId("panel-clean-results")}
        {...DATA.panelHidden(ui.panels["panel-clean-results"]?.hidden ?? false)}
      >
        <h3 className="settings-card__heading">
          <span aria-hidden="true">✅ </span>
          Clean Recommendations ({clean.length})
        </h3>
        {clean.length === 0
          ? <p className="text-sm text-gray-400">No clean recommendations.</p>
          : clean.map((r, i) => (
              <RecommendationCard key={i} rec={r} index={i} flagged={false} />
            ))
        }
      </div>

      {/* Flagged results */}
      {flagged.length > 0 && (
        <div
          id={IDS.settingsCard("flagged-results")}
          className="settings-card status-banner--warn p-0 overflow-hidden"
          {...DATA.panelId("panel-flagged-results")}
          {...DATA.panelHidden(ui.panels["panel-flagged-results"]?.hidden ?? false)}
        >
          <button
            className="flex items-center gap-2 font-bold text-amber-800 w-full text-left p-4"
            onClick={() => setShowFlagged(v => !v)}
            aria-expanded={showFlagged}
          >
            <span aria-hidden="true">{showFlagged ? "▾" : "▸"}</span>
            <span aria-hidden="true">⚠ </span>
            {flagged.length} item{flagged.length !== 1 ? "s" : ""} need review
            <span className="text-xs font-normal text-amber-600 ml-1">(partial fix detected)</span>
          </button>
          {showFlagged && (
            <div className="px-4 pb-4">
              {flagged.map((r, i) => (
                <RecommendationCard key={i} rec={r} index={i} flagged />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE: src/components/shared/ConnectionPanel.tsx  [CHANGE — selectors]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const _connectionPanelTsx = `
// src/components/shared/ConnectionPanel.tsx
import { useState } from "react";
import {
  getConnectionDebugContext,
  testCohereConnection,
  type ConnectionTestResult,
} from "../../lib/cohereClient";
import { useAppState } from "../../context/AppContext";
import { CLS, IDS, DATA } from "../../lib/uiSelectors";

export function ConnectionPanel() {
  const { apiKey, cfg, ui } = useAppState();
  const [result,        setResult]        = useState<ConnectionTestResult | null>(null);
  const [testing,       setTesting]       = useState(false);
  const [showDebug,     setShowDebug]     = useState(false);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    setShowDebug(true);
    setDebugMessages([]);
    const r = await testCohereConnection(apiKey, cfg, message => {
      setDebugMessages(cur => [...cur, message]);
    });
    setResult(r);
    setTesting(false);
  };

  const dot = result
    ? result.ok ? "bg-green-500" : "bg-red-500"
    : testing ? "bg-yellow-500 animate-pulse" : "bg-gray-300";

  const label = testing
    ? "Testing…"
    : result
      ? result.ok ? \`Connected — \${result.stage}\` : \`Failed — \${result.stage}\`
      : apiKey ? "Credentials entered — not tested" : "No API key";

  const stageHint: Record<string, string> = {
    "Local Proxy":      "The request never reached Cohere. Check the local Express proxy server and API base URL.",
    "Upstream Auth":    "The proxy reached Cohere, but the API key was rejected.",
    "Rate Limit":       "The proxy reached Cohere, but the request was rate-limited.",
    "Response Shape":   "Cohere returned HTTP 200, but the payload was unusable.",
    "Upstream Error":   "Cohere returned an unexpected upstream error.",
  };

  const debugContext = getConnectionDebugContext(apiKey);

  // Read panel-level visibility from UiState (debug subpanel only)
  const debugHidden = ui.panels["panel-debug-connection"]?.hidden ?? true;

  return (
    <div
      id={IDS.settingsCard("connection")}
      className={CLS.settingsCard}
      {...DATA.panelId("panel-connection")}
      {...DATA.panelHidden(ui.panels["panel-connection"]?.hidden ?? false)}
    >
      <h3 className="settings-card__heading">
        <span aria-hidden="true">🔑 </span>Cohere Connection (via local proxy)
      </h3>

      {/* Status indicator */}
      <div className="flex items-center gap-2 mb-4" role="status" aria-live="polite">
        <div className={\`w-2.5 h-2.5 rounded-full \${dot}\`} aria-hidden="true" />
        <span className="text-sm font-semibold text-gray-600">{label}</span>
      </div>

      <button
        id={IDS.actionTestConnection}
        className={CLS.actionSecondary}
        onClick={handleTest}
        disabled={testing}
        aria-busy={testing}
      >
        {testing ? "⏳ Testing…" : "⚡ Test Connection"}
      </button>

      {/* Debug section */}
      {(testing || result || debugMessages.length > 0) && (
        <div
          id={IDS.debugPanelConnection}
          className="mt-3"
          {...DATA.panelHidden(debugHidden && !testing && !result)}
        >
          {result && !result.ok && stageHint[result.stage] && (
            <p className="text-xs text-red-500 mb-2">{stageHint[result.stage]}</p>
          )}

          <button
            className={CLS.actionGhost}
            onClick={() => setShowDebug(v => !v)}
            aria-expanded={showDebug}
          >
            {showDebug ? "▾ Hide" : "▸ Show"} debug
          </button>

          {showDebug && (
            <div className={\`mt-2 rounded-lg border p-3 text-xs whitespace-pre-wrap break-words space-y-3
              \${result?.ok ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}\`}
            >
              <div>
                <p className="font-semibold text-slate-700 mb-1">Debug Context</p>
                <div className="text-slate-600 space-y-0.5">
                  <div>Configured VITE_API_BASE_URL: {debugContext.configuredApiBase || "(empty)"}</div>
                  <div>Resolved API base: {debugContext.resolvedApiBase}</div>
                  <div>Proxy endpoint: {debugContext.proxyEndpoint}</div>
                  <div>Client fallback key present: {debugContext.clientKeyPresent ? "yes" : "no"}</div>
                </div>
                {debugContext.warnings.length > 0 && (
                  <div className="mt-2 text-amber-700">
                    {debugContext.warnings.map((w, i) => <div key={i}>Warning: {w}</div>)}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Debug Log</p>
                <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-slate-700">
                  {debugMessages.length > 0 ? debugMessages.join("\\n") : "No debug messages yet."}
                </pre>
              </div>
              {result && (
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Result Detail</p>
                  <pre className={\`\${result.ok ? "text-green-700" : "text-red-700"} max-h-40 overflow-y-auto whitespace-pre-wrap\`}>
                    {result.detail}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// END OF HANDOFF FILE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// SUMMARY OF ALL CHANGES
// ──────────────────────
// NEW FILES (3)
//   src/types/uiConfig.ts      — UiState, UiSkin, PanelId, UiDirConfig types
//   src/config/uiConfig.ts     — UI_DEFAULTS, SKIN_OPTIONS, DENSITY_OPTIONS
//   src/lib/uiSelectors.ts     — CLS, IDS, QUERY, DATA semantic selector constants
//   src/components/tabs/UiTab.tsx — 🎨 Appearance tab (dev-only)
//
// CHANGED FILES (7)
//   src/context/AppContext.tsx  — Added UiState slice + 6 new action types
//   src/index.css               — @theme tokens, skin/density overrides,
//                                 panel visibility, @layer components
//   tailwind.config.ts          — Retired v3 content array (now inert in v4)
//   src/App.tsx                 — Semantic ids, dir wiring, Appearance tab
//   src/components/tabs/ConfigTab.tsx    — Selectors, a11y, token refs
//   src/components/tabs/InputTab.tsx     — Selectors, a11y, token refs
//   src/components/tabs/OutputTab.tsx    — Selectors, dl stats, a11y
//   src/components/shared/ConnectionPanel.tsx — Selectors, debug panel data-attrs
//
// ACCESSIBILITY IMPROVEMENTS
//   - All toggles: div → <button role="switch" aria-checked data-checked>
//   - Emoji in headings wrapped in <span aria-hidden="true">
//   - Stats bar: div/div → <dl><dt><dd>
//   - Result cards: div/div → <dl><dt><dd>
//   - :focus-visible rule in @layer base {}
//   - aria-label on textarea, aria-busy on submit button, aria-live on status
//   - sr-only utility added for screen-reader-only text
//
// ZERO BREAKING CHANGES
//   - All existing logic, session handling, and API calls are untouched.
//   - UiState is additive to AppState.
//   - New CSS classes are opt-in; old Tailwind classes can coexist.
//   - Appearance tab is dev-only — no production exposure.


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE: src/components/shared/UsageMonitor.tsx  [CHANGE — selectors + a11y]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Changes from original:
//   - Card: hardcoded classes → settings-card + data-panel-id/hidden
//   - Heading: emoji wrapped in aria-hidden span + settings-card__heading
//   - Hardcoded color #1c2b4a → text-[--color-brand-900]
//   - Reset button: inline class string → CLS.actionGhost
//   - Progress bar: aria-valuenow/valuemin/valuemax added for AT
//   - Reads ui.panels["panel-usage"] for visibility coordination
export const _usageMonitorTsx = `
// src/components/shared/UsageMonitor.tsx
import { useEffect, useState } from "react";
import { getMonthlyUsage, resetMonthlyUsage } from "../../lib/usageCounter";
import { useAppState } from "../../context/AppContext";
import { CLS, IDS, DATA } from "../../lib/uiSelectors";

export function UsageMonitor() {
  const { cfg, ui } = useAppState();
  const [usage, setUsage] = useState(getMonthlyUsage());

  // Refresh on mount and whenever the window regains focus
  useEffect(() => {
    const refresh = () => setUsage(getMonthlyUsage());
    window.addEventListener("focus", refresh);
    refresh();
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const ceiling  = cfg.monthlyCallCeiling;
  const pct      = ceiling ? Math.min(100, Math.round((usage.count / ceiling) * 100)) : 0;
  const barColor = !ceiling || pct < 70
    ? "bg-green-500"
    : pct < 90 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div
      id={IDS.settingsCard("usage")}
      className={CLS.settingsCard}
      {...DATA.panelId("panel-usage")}
      {...DATA.panelHidden(ui.panels["panel-usage"]?.hidden ?? false)}
    >
      <h3 className="settings-card__heading">
        <span aria-hidden="true">📊 </span>Monthly Usage
      </h3>

      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-500">{usage.month}</span>
        <span className="font-bold text-[--color-brand-900]">
          {usage.count.toLocaleString()}
          {ceiling ? \` / \${ceiling.toLocaleString()}\` : ""} calls
        </span>
      </div>

      {ceiling && (
        <>
          {/* Accessible progress bar */}
          <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={\`Monthly usage: \${pct}%\`}
            className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1"
          >
            <div
              className={\`h-full \${barColor} rounded-full transition-all\`}
              style={{ width: \`\${pct}%\` }}
            />
          </div>
          <p className={CLS.fieldCaption}>{pct}% of monthly trial ceiling used</p>
        </>
      )}

      {!ceiling && (
        <p className={CLS.fieldCaption}>
          Production tier — no monthly ceiling tracked client-side.
        </p>
      )}

      <button
        className={\`\${CLS.actionGhost} mt-3 text-red-400 hover:text-red-600 underline\`}
        onClick={() => { resetMonthlyUsage(); setUsage(getMonthlyUsage()); }}
      >
        Reset counter
      </button>
    </div>
  );
}
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE: src/components/shared/ChunkProgressList.tsx  [CHANGE — selectors + a11y]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Changes from original:
//   - Card: hardcoded classes → settings-card
//   - Heading: emoji → aria-hidden + settings-card__heading
//   - Status list wrapped in <ol> (ordered — chunk order is meaningful)
//   - aria-live="polite" on wrapper so AT announces chunk completions
//   - Each row has an aria-label combining chunk position + status
//   - Spinning icon: aria-hidden (decorative; the status text carries meaning)
export const _chunkProgressListTsx = `
// src/components/shared/ChunkProgressList.tsx
import type { ChunkProgress } from "../../lib/proofreadingSession";
import { CLS } from "../../lib/uiSelectors";

const STATUS_ICON: Record<string, string> = {
  pending: "○",
  running: "◌",
  done:    "✓",
  error:   "✗",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-gray-400",
  running: "text-yellow-500 animate-spin",
  done:    "text-green-600",
  error:   "text-red-500",
};

interface Props {
  progress: ChunkProgress[];
}

export function ChunkProgressList({ progress }: Props) {
  if (progress.length === 0) return null;

  return (
    <div
      className={\`\${CLS.settingsCard} mt-4\`}
      aria-live="polite"
      aria-label="Chunk analysis progress"
    >
      <h3 className="settings-card__heading">
        <span aria-hidden="true">⏳ </span>Analysis Progress
      </h3>

      <ol className="list-none m-0 p-0">
        {progress.map((p) => (
          <li
            key={p.index}
            className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
            aria-label={\`Chunk \${p.index + 1} of \${p.total}: \${p.status}\${p.errorMessage ? " — " + p.errorMessage : ""}\`}
          >
            {/* Decorative status icon — meaning carried by aria-label above */}
            <span
              aria-hidden="true"
              className={\`text-lg w-6 text-center \${STATUS_COLOR[p.status]}\`}
            >
              {STATUS_ICON[p.status]}
            </span>

            <span className="flex-1 text-sm text-gray-700">
              Chunk {p.index + 1} of {p.total}
            </span>

            {p.errorMessage && (
              <span className="text-xs text-red-400 truncate max-w-xs">
                {p.errorMessage}
              </span>
            )}

            <span className="text-xs font-semibold capitalize text-gray-500">
              {p.status}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE: src/components/tabs/PlaygroundTab.tsx  [CHANGE — selectors only]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Playground is dev-only and its internals vary by experiment.
// This pass adds only the shell-level semantic ids and the
// standard card/field class tokens. Inner logic is unchanged.
// Apply this as a search-and-replace on top of the existing file.
export const _playgroundTabPatch = `
// src/components/tabs/PlaygroundTab.tsx — PATCH NOTES
//
// This is not a full rewrite. Apply these targeted replacements:
//
// 1. Add import at top:
//    import { CLS, IDS } from "../../lib/uiSelectors";
//
// 2. Outer wrapper div:
//    BEFORE: <div className="space-y-4">
//    AFTER:  <div id="tab-panel-playground" className="space-y-4">
//
// 3. Any card div matching  className="rounded-xl bg-white p-5 shadow-sm"
//    AFTER:  className={CLS.settingsCard}
//    (add a meaningful id="settings-card-playground-{name}" to each)
//
// 4. Any hardcoded #1c2b4a color reference:
//    AFTER:  text-[--color-brand-900]  or  bg-[--color-brand-900]
//            border-[--color-brand-900]  as appropriate
//
// 5. Any submit/primary action button:
//    AFTER:  className={CLS.actionPrimary}
//            id="action-playground-run" (or appropriate id)
//
// 6. Any secondary button (clear, reset, etc.):
//    AFTER:  className={CLS.actionSecondary}
//
// 7. Any ghost / text-only link-button:
//    AFTER:  className={CLS.actionGhost}
//
// No logic, state, or API changes in PlaygroundTab — selector pass only.
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// APPENDIX A — COMMON MIGRATION PATTERNS (quick-reference)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const _migrationPatterns = `
/*
════════════════════════════════════════════════════════════════
COMMON MIGRATION PATTERNS — quick-reference for applying changes
════════════════════════════════════════════════════════════════

These cover the four most repetitive patterns across all files.
Each shows BEFORE → AFTER so diffs are predictable.

──────────────────────────────────────────────────────────────
PATTERN 1 — Card shell replacement
──────────────────────────────────────────────────────────────
BEFORE:
  <div className="rounded-xl bg-white p-5 shadow-sm">

AFTER (standard card):
  <div id={IDS.settingsCard("my-name")} className={CLS.settingsCard}>

AFTER (compact single-control card):
  <div id={IDS.settingsCard("my-name")} className={CLS.settingsCardCompact}>

Note: CLS.settingsCardCompact expands to "settings-card settings-card--compact"
      which triggers the compact padding override from index.css.

──────────────────────────────────────────────────────────────
PATTERN 2 — Card heading replacement
──────────────────────────────────────────────────────────────
BEFORE:
  <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">🔑 API Key</h3>

AFTER:
  <h3 className="settings-card__heading">
    <span aria-hidden="true">🔑 </span>API Key
  </h3>

Why: emoji read aloud as "key emoji" by screen readers, breaking
     heading comprehension. aria-hidden suppresses it.

──────────────────────────────────────────────────────────────
PATTERN 3 — Toggle div → accessible switch button
──────────────────────────────────────────────────────────────
BEFORE:
  <div
    onClick={() => set({ myFlag: !cfg.myFlag })}
    className={\`w-11 h-6 rounded-full ... \${cfg.myFlag ? "bg-[#1c2b4a]" : "bg-gray-300"}\`}
  >
    <div className={\`w-4 h-4 rounded-full ... \${cfg.myFlag ? "translate-x-5" : "translate-x-1"}\`} />
  </div>

AFTER:
  <button
    role="switch"
    aria-checked={cfg.myFlag}
    aria-label="Label describing what this toggles"
    data-checked={String(cfg.myFlag)}
    className={CLS.toggleSwitch}
    onClick={() => set({ myFlag: !cfg.myFlag })}
  >
    <span className={CLS.toggleSwitchTrack}>
      <span className={CLS.toggleSwitchThumb} />
    </span>
    <span className="text-sm font-semibold text-gray-700">
      {cfg.myFlag ? "Enabled label" : "Disabled label"}
    </span>
  </button>

Why: The original div is keyboard-invisible, has no role, and
     has no accessible name. AT cannot interact with it at all.
     The new pattern is a proper ARIA switch.
     CSS state in index.css reads data-checked="true"/"false" —
     no JS className toggling needed.

──────────────────────────────────────────────────────────────
PATTERN 4 — Hardcoded color token replacement
──────────────────────────────────────────────────────────────
BEFORE (any color use):
  text-[#1c2b4a]
  bg-[#1c2b4a]
  border-[#1c2b4a]
  hover:bg-[#2d3f6b]
  focus:border-[#1c2b4a]

AFTER:
  text-[--color-brand-900]
  bg-[--color-brand-900]
  border-[--color-brand-900]
  hover:bg-[--color-brand-800]
  focus:border-[--color-brand-900]

Why: CSS custom properties defined in @theme {} are the single
     source of truth. The [data-skin="warm"] {} override block
     in index.css repoints the same tokens automatically.
     No grep-and-replace needed when a skin changes.

──────────────────────────────────────────────────────────────
PATTERN 5 — Panel visibility wiring (add to existing cards)
──────────────────────────────────────────────────────────────
Required imports (add once per file):
  import { DATA } from "../../lib/uiSelectors";
  import type { PanelId } from "../../types/uiConfig";
  // also destructure ui from useAppState():
  const { cfg, ui } = useAppState();

Then on each card div, add two spread attributes:
  {...DATA.panelId("panel-my-card" as PanelId)}
  {...DATA.panelHidden(ui.panels["panel-my-card"]?.hidden ?? false)}

The CSS rule  [data-panel-hidden="true"] { display: none; }
in index.css handles the rest — no conditional rendering needed.
*/
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// APPENDIX B — TYPE RECONCILIATION NOTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const _typeNotes = `
/*
════════════════════════════════════════════════════════════════
TYPE RECONCILIATION NOTES
════════════════════════════════════════════════════════════════

The existing repo has two type files that this handoff integrates with:

  src/types/featureConfig.ts  — FeatureConfig, CustomInstructionsMode
  src/context/AppContext.tsx  — AppTab, AppState, AppAction (existing)

This handoff adds:

  src/types/uiConfig.ts       — UiState, UiSkin, PanelId, UiDirConfig
  src/config/uiConfig.ts      — UI_DEFAULTS, SKIN_OPTIONS, DENSITY_OPTIONS

IMPORTANT: AppContext.tsx imports both. The updated AppContext.tsx
shown in _appContextDiff above is a complete replacement that
merges both import sets. Do not apply the diff lines in isolation
on top of the existing file — use the full replacement shown.

The UiTab component imports:
  - useAppState / useAppDispatch from AppContext
  - SKIN_OPTIONS / DENSITY_OPTIONS / UI_DEFAULTS from config/uiConfig
  - CLS / IDS / DATA from lib/uiSelectors
  - PanelId / UiDirOverride from types/uiConfig

No circular dependencies are introduced. The dependency graph is:

  types/uiConfig      ← (no deps)
  config/uiConfig     ← types/uiConfig
  lib/uiSelectors     ← types/uiConfig, context/AppContext (type import only)
  context/AppContext  ← types/uiConfig, config/uiConfig
  UiTab               ← all of the above
  ConfigTab etc.      ← context/AppContext, lib/uiSelectors, types/uiConfig

The "appearance" display tab is typed locally in App.tsx as
  type DisplayTab = AppTab | "appearance"
to keep the AppTab union clean for feature logic (session dispatch,
routing, config semantics). UiTab does not receive activeTab as a prop;
it reads ui state only.
*/
`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// APPENDIX C — FUTURE ROADMAP HOOKS (architecture notes)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const _futureRoadmapHooks = `
/*
════════════════════════════════════════════════════════════════
FUTURE ROADMAP HOOKS
════════════════════════════════════════════════════════════════
These are NOT implemented in this handoff. They are documented
here so the architecture already supports them without refactor.

── 1. localStorage / session persistence ────────────────────────
UiState is currently in-memory (AppContext reducer).
To add persistence, wrap the reducer with a storage adapter:

  function withPersistence(reducer) {
    return (state, action) => {
      const next = reducer(state, action);
      if (action.type.startsWith("SET_UI_") || action.type === "SET_PANEL_HIDDEN") {
        localStorage.setItem("ui-prefs", JSON.stringify(next.ui));
      }
      return next;
    };
  }

And load from storage in initialState:
  const stored = localStorage.getItem("ui-prefs");
  ui: stored ? { ...UI_DEFAULTS, ...JSON.parse(stored) } : UI_DEFAULTS

The UiState type shape is designed to be safely serialisable.

── 2. i18n / locale hookup ─────────────────────────────────────
UiState.dir.global and .pageOverride are the integration points.
A future i18n provider would:
  dispatch({ type: "SET_UI_DIR",          dir: locale.dir })
  dispatch({ type: "SET_UI_DIR_OVERRIDE", tab: "input", dir: "rtl" })

No component changes needed — the Shell already reads these.

── 3. Dark mode ─────────────────────────────────────────────────
Add to UiState:
  colorScheme: "light" | "dark" | "system"

In App.tsx Shell:
  Apply  data-color-scheme={ui.colorScheme}  on #app-shell.

In index.css:
  [data-color-scheme="dark"] {
    --color-surface: #1e2327;
    --color-surface-soft: #16191d;
    ...
  }
  @media (prefers-color-scheme: dark) {
    [data-color-scheme="system"] { /* same overrides */ }
  }

── 4. Arabic font selector ──────────────────────────────────────
Add to UiState:
  arabicFont: "default" | "amiri" | "noto-arabic" | "scheherazade"

In index.css:
  [data-arabic-font="amiri"]        { --font-arabic: "Amiri", serif; }
  [data-arabic-font="noto-arabic"]  { --font-arabic: "Noto Sans Arabic", sans-serif; }

App.tsx applies  data-arabic-font={ui.arabicFont}  on #app-shell.
.arabic-text picks it up via  font-family: var(--font-arabic).

── 5. Skin preset export/import ─────────────────────────────────
UiState is JSON-serialisable as designed. A future "share skin"
feature could base64-encode the ui slice and read it from a URL param.
The type shape is stable enough to version with a "v" field.

── 6. Per-tab direction button in tab bar ───────────────────────
A compact dir toggle can live directly in the tab bar for power users:

  <button
    aria-label="Toggle page direction"
    onClick={() => dispatch({ type:"SET_UI_DIR_OVERRIDE", tab: activeTab, dir: activeDir === "ltr" ? "rtl" : "ltr" })}
    className={CLS.actionGhost}
  >
    {activeDir === "ltr" ? "→ RTL" : "← LTR"}
  </button>

Position: right-aligned within .app-tab-bar using ml-auto on a
wrapper span. No new state needed — reads from UiState.dir already.

── 7. Preset skins as named themes ──────────────────────────────
When more skins accumulate, move SKIN_OPTIONS to a separate
src/config/skins.ts file and load them dynamically. The
data-skin attribute hook on #app-shell will still be the
coordination point — no component changes needed.
*/
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// END OF COMPLETE HANDOFF
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Total files covered: 13 (4 new, 9 changed)
// Companion documents: ui-audit-report.md, migration-notes.md
