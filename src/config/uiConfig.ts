
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

const STORAGE_KEY = "ui-prefs";

export function mergeStoredUiWithDefaults(stored: unknown): UiState {
  if (typeof stored !== "object" || stored === null || Array.isArray(stored)) {
    return UI_DEFAULTS;
  }

  const s = stored as Record<string, unknown>;

  const validSkins: UiState["skin"][] = ["default", "warm", "high-contrast"];
  const skin: UiState["skin"] =
    typeof s.skin === "string" && validSkins.includes(s.skin as UiState["skin"])
      ? (s.skin as UiState["skin"])
      : UI_DEFAULTS.skin;

  const validDensities: UiState["density"][] = ["default", "compact"];
  const density: UiState["density"] =
    typeof s.density === "string" && validDensities.includes(s.density as UiState["density"])
      ? (s.density as UiState["density"])
      : UI_DEFAULTS.density;

  const validDirs = ["ltr", "rtl"];
  const validOverrides = ["ltr", "rtl", "inherit"];
  const storedDir =
    typeof s.dir === "object" && s.dir !== null && !Array.isArray(s.dir)
      ? (s.dir as Record<string, unknown>)
      : {};

  const global: UiState["dir"]["global"] =
    typeof storedDir.global === "string" && validDirs.includes(storedDir.global)
      ? (storedDir.global as UiState["dir"]["global"])
      : UI_DEFAULTS.dir.global;

  const storedPageOverride =
    typeof storedDir.pageOverride === "object" &&
    storedDir.pageOverride !== null &&
    !Array.isArray(storedDir.pageOverride)
      ? (storedDir.pageOverride as Record<string, unknown>)
      : {};

  const pageOverride: UiState["dir"]["pageOverride"] = {
    ...UI_DEFAULTS.dir.pageOverride,
  };

  for (const [tab, value] of Object.entries(storedPageOverride)) {
    if (typeof value === "string" && validOverrides.includes(value)) {
      (pageOverride as Record<string, string>)[tab] = value;
    }
  }

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
        ...UI_DEFAULTS.panels[panelId],
        hidden: (storedPanel as { hidden: boolean }).hidden,
      };
    }
  }

  return {
    skin,
    density,
    dir: { global, pageOverride },
    panels,
  };
}

export function loadStoredUiPrefs(): UiState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return UI_DEFAULTS;
    return mergeStoredUiWithDefaults(JSON.parse(raw) as unknown);
  } catch {
    return UI_DEFAULTS;
  }
}

export function saveUiPrefs(ui: UiState): void {
  try {
    const payload = {
      skin: ui.skin,
      density: ui.density,
      dir: {
        global: ui.dir.global,
        pageOverride: ui.dir.pageOverride,
      },
      panels: Object.fromEntries(
        Object.entries(ui.panels).map(([id, panel]) => [id, { hidden: panel.hidden }])
      ),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures so UI preference persistence never breaks the app.
  }
}
