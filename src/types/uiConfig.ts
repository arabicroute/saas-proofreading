
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
