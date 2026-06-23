
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

  tabButton:  (tab: AppTab | "appearance") => `tab-button-${tab}`,
  tabPanel:   (tab: AppTab | "appearance") => `tab-panel-${tab}`,

  settingsCard: (name: string) => `settings-card-${name}`,

  banner: (name: string) => `banner-${name}`,

  // Action buttons
  actionStartProofreading: "action-start-proofreading",
  actionTestConnection:    "action-test-connection",
  actionExportJson:        "action-export-json",

  // Result cards
  resultCardClean:   (index: number) => `result-card-clean-${index}`,
  resultCardFlagged: (index: number) => `result-card-flagged-${index}`,

  // Stats
  statsPanel: "stats-panel",

  // Debug
  debugPanelConnection: "debug-panel-connection",
} as const;

// ── CSS query helpers (for tests / future e2e) ─────────────────────
export const QUERY = {
  tabButton:  (tab: AppTab | "appearance") => `#${IDS.tabButton(tab)}`,
  tabPanel:   (tab: AppTab | "appearance") => `#${IDS.tabPanel(tab)}`,
  settingsCard: (name: string) => `#${IDS.settingsCard(name)}`,
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
