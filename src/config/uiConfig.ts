
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
