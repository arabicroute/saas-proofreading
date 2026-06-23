# UI Audit Report — cohere-proofreader
**Date:** 2026-06-21  
**Repo:** `arabicroute/saas-proofreading` (branch: `main`)  
**Auditor:** Design Systems Engineer (AI Co-Designer)

---

## 1. Audit Scope

Files reviewed: `App.tsx`, `index.css`, `AppContext.tsx`, `ConfigTab.tsx`, `InputTab.tsx`, `OutputTab.tsx`, `ConnectionPanel.tsx`, `UsageMonitor.tsx`, `ChunkProgressList.tsx`, `tailwind.config.ts`, `package.json`.

Evaluation criteria: layout density, visual hierarchy, card structure, spacing rhythm, color usage, tab navigation clarity, typography and RTL treatment, accessibility risks, affordance and discoverability of major controls.

---

## 2. Findings

### A1 · Brand color is hard-coded in every component file

`#1c2b4a` (navy) appears individually in `App.tsx`, `ConfigTab.tsx`, `InputTab.tsx`, `OutputTab.tsx`, `UsageMonitor.tsx`, and `ConnectionPanel.tsx`. The hover variant `#2d3f6b` also appears in several files. There is no single source of truth. A palette change requires a grep-and-replace across the codebase with high risk of missed instances.

**Proposed fix:** Define `--color-brand-900` and `--color-brand-800` in `@theme {}` inside `index.css`. Replace all literal hex references with `text-[--color-brand-900]`, `bg-[--color-brand-900]`, etc. The skin override mechanism (`[data-skin="warm"] { --color-brand-900: ... }`) then handles the full palette change from one place.

---

### A2 · Card shell pattern is repeated without any abstraction

`rounded-xl bg-white p-5 shadow-sm` appears verbatim in at least 9 places across the codebase. This is the most repeated structural pattern and has no semantic wrapper, no shared component, and no shared class.

**Proposed fix:** Define `.settings-card` in `@layer components {}` in `index.css`. A `settings-card--compact` modifier reduces padding to `p-3` for single-control cards (like Multi-Turn Chunking) that do not need the full padding of multi-control cards like Inference Parameters.

---

### A3 · Tab bar has no semantic hooks whatsoever

Tab `<button>` elements in `App.tsx` have zero `id`, zero semantic `className`, and no `role` attributes beyond what the browser infers from the tag. The active vs inactive state is expressed purely through inline Tailwind conditionals:

```
border-[#1c2b4a] text-[#1c2b4a]   ← active
border-transparent text-gray-400   ← inactive
```

There is no way to target a specific tab button from a CSS override, a test runner, or a future theme layer without matching on fragile computed class strings.

**Proposed fix:** Add `id="tab-button-{tabId}"`, `className="tab-button"` (plus `tab-button--active` when active), and `role="tab"` / `aria-selected={active}` to every tab button. The `.tab-button` and `.tab-button--active` classes replace all inline color logic.

---

### A4 · Toggle controls are `<div>` elements — critical accessibility gap

In `ConfigTab.tsx`, all toggle switches are implemented as clickable `<div>` elements:

```jsx
<div onClick={() => set({ multiTurn: !cfg.multiTurn })} className="w-11 h-6 rounded-full ...">
  <div className="w-4 h-4 rounded-full bg-white ..." />
</div>
```

These are completely invisible to keyboard users (not focusable), have no ARIA `role`, no `aria-checked`, and no accessible name. A screen reader user cannot discover or operate them at all. This is a WCAG 4.1.2 (Name, Role, Value) failure.

**Proposed fix:** Replace with `<button role="switch" aria-checked={value} data-checked={String(value)} aria-label="...">`. CSS in `index.css` reads `data-checked="true"` to control the visual state — no additional className toggling needed.

---

### A5 · Card headings use emoji as structural content

Headings like `🔑 API Key`, `🤖 Model`, `📊 Monthly Usage` rely on emoji to carry the semantic association between the icon and the topic. Screen readers announce emoji by their Unicode description ("key emoji", "robot face emoji"), breaking the heading's reading flow. The structural meaning ("this card is about API keys") is partially lost.

**Proposed fix:** Wrap all decorative emoji in `<span aria-hidden="true">`. The heading text alone then carries the full accessible name.

---

### A6 · ConfigTab is over-tall with no progressive disclosure

ConfigTab stacks 7 full-height cards vertically with no collapsing, grouping, or density management. On a standard laptop viewport (768px height) the user must scroll through the equivalent of approximately 3 screen-heights to review all settings before they can reach the main action (which lives in InputTab).

**Proposed fix (incremental):** Introduce `data-panel-hidden` attribute on each card, driven by `UiState.panels`. The Appearance tab provides panel visibility toggles. Cards remain in the DOM when hidden (to preserve form state); only `display: none` is applied via CSS. This gives power users a way to collapse panels they never change without removing them permanently.

---

### A7 · Card padding is uniform regardless of card content density

All cards use `p-5` (1.25rem). The Multi-Turn Chunking card contains a single toggle and a one-line caption — it occupies the same vertical space as the Inference Parameters card, which contains four controls. The padding-to-content ratio for the single-toggle card is extremely wasteful.

**Proposed fix:** Apply `.settings-card--compact` (padding: `0.75rem`) to single-control cards. Multi-control cards keep the default `p-5`.

---

### A8 · Typography hierarchy is nearly flat

The current text size structure:

| Element | Current | Problem |
|---|---|---|
| Tab button (active) | `text-xs font-semibold` | Same size as inactive — no active emphasis |
| Card heading (h3) | `text-sm font-bold` | Too small for a section heading |
| Field label | `text-sm font-semibold` | Indistinguishable from card heading |
| Help / caption | `text-xs text-gray-400` | Only differentiator is color |
| Stats numbers | `text-xl font-bold` | Correct — largest element |

The result is that scanning a card for its heading vs its labels requires reading content, not perceiving hierarchy.

**Proposed fix:** Card headings → `0.9375rem (≈15px) font-semibold`; field labels → `0.875rem font-semibold`; captions → `0.75rem text-gray-400`; tab buttons → `0.8125rem (13px)` up from `12px`. All defined in `@layer components {}` via `.settings-card__heading`, `.field-label`, `.field-caption`.

---

### A9 · Output stats bar is not semantically marked up

The stats bar renders four metric cells with a label above a bold number:

```jsx
<div className="text-xs text-gray-400 mb-1">{label}</div>
<div className="text-xl font-bold">{value}</div>
```

These are visually adjacent but have no DOM relationship. A screen reader encounters four unlabeled numbers. `aria-label` on the outer div is not inherited by the inner number elements.

**Proposed fix:** Replace with `<dl><dt>label</dt><dd>value</dd></dl>` pairs. Add `aria-label="Proofreading statistics"` on the `<dl>`. This is the semantically correct pattern for key-value data.

---

### A10 · RTL direction is applied only to leaf text nodes

`dir="rtl"` appears only on individual `<textarea>` elements and `.arabic-text` spans. There is no coordination point for a shell-level direction preference. If a fully Arabic-speaking operator wanted to flip the page layout to RTL (so the sidebar, tab order, and spatial flow matched RTL reading convention), there is no mechanism to do this.

**Proposed fix:** Introduce `UiState.dir.global` and `UiState.dir.pageOverride` in the context slice. `App.tsx` reads `pageOverride[activeTab] ?? global` and applies it as the `dir` attribute on the `#app-content` wrapper div surrounding the active tab. Individual `dir="rtl"` on textareas can remain as overrides where needed.

---

### A11 · Debug panel state is siloed in local component state

`showDebug` in `ConnectionPanel.tsx` is `useState(false)` — entirely local, not part of any cross-component visibility model. This means the Appearance tab cannot offer an "always expand debug" preference, and there is no way to control the debug panel visibility from the outside.

**Proposed fix:** Add `panel-debug-connection` to the `PanelId` union and `UiState.panels`. The panel's local `showDebug` state continues to handle the in-session toggle, but `UiState` controls whether the panel section renders at all (via `data-panel-hidden`). The two concerns remain separate: UiState = should this panel exist at all; local state = is it currently expanded.

---

### A12 · No `:focus-visible` rule is defined

`index.css` has no `:focus-visible` rule. Browsers apply their own default focus ring, which some reset stylesheets suppress entirely. On Chromium, the default outline is thin and low-contrast against the `#1c2b4a` blue background of buttons.

**Proposed fix:** Add a single `:focus-visible` rule in `@layer base {}`:
```css
:focus-visible {
  outline: 2px solid var(--color-brand-900);
  outline-offset: 2px;
  border-radius: 4px;
}
```

---

## 3. New UI-Management Tab — Design Specification

### 3.1 Tab identity

| Property | Value |
|---|---|
| Tab ID | `appearance` |
| Display label | `🎨 Appearance` |
| Position in tab strip | After Output, before Playground |
| Dev-only gate | Yes — `IS_DEV` guard in App.tsx |
| Production exposure | Not yet — graduate to production after skin system is battle-tested |

### 3.2 What belongs in UiTab vs ConfigTab

**Stays in ConfigTab:** API key, connection test, plan tier, model selection, inference parameters, multi-turn chunking, custom instructions, usage monitor. These are functional settings that affect proofreading behaviour.

**Lives in UiTab:** Color skin / preset, layout density, global text direction, per-tab direction overrides, panel visibility toggles. These control how the UI looks and what is shown — not how the proofreader works.

### 3.3 UiState schema

```
UiState {
  skin:    "default" | "warm" | "high-contrast"
  density: "default" | "compact"
  dir: {
    global:       "ltr" | "rtl"
    pageOverride: Partial<Record<AppTab, "ltr" | "rtl" | "inherit">>
  }
  panels: Record<PanelId, { hidden: boolean; label: string; tab: AppTab | "any" }>
}
```

### 3.4 How skins work at runtime

The skin value is written to `data-skin` on `#app-shell`. CSS in `index.css` defines `[data-skin="warm"] { --color-brand-900: ... }` override blocks. No JavaScript class toggling, no Tailwind safelist, no conditional renders. All components read the CSS custom property via `text-[--color-brand-900]` and update automatically.

### 3.5 How panel visibility works at runtime

Each card receives `data-panel-hidden="true|false"` driven from `UiState.panels`. The CSS rule `[data-panel-hidden="true"] { display: none }` in `index.css` hides it. The DOM node remains present so no form state is lost when a panel is hidden and then shown again. UiTab renders a toggle row for each named panel, grouped by tab.

### 3.6 How direction works at runtime

The `App.tsx` shell resolves the effective direction for the active tab: `pageOverride[activeTab] ?? global`. This value is applied as the `dir` attribute on the `#app-content` wrapper. The two levels are:

- **Global** — operator-level preference for the whole shell (e.g., "I want RTL everywhere")
- **Per-tab override** — tab-specific refinement (e.g., "Input and Output tabs use RTL; Config tab stays LTR")

The system is intentionally not i18n. A future locale provider can write into the same dispatch actions without any component changes.

---

## 4. Selector Naming Plan

### 4.1 Conventions

- **`className` tokens** (`CLS.*`): kebab-case, role-based, not appearance-based. Describe what the element is in the design system, not what color it is. These are semantic classes defined in `@layer components {}`.
- **`id` attributes** (`IDS.*`): `{role}-{qualifier}`. Always unique per page. Generated by factory functions in `uiSelectors.ts`.
- **`data-*` attributes** (`DATA.*`): `data-{domain}-{property}`. Drive CSS state and visibility. Never used for selection in production JS.

### 4.2 Complete vocabulary

**Shell**

| Selector | Type | Element |
|---|---|---|
| `id="app-shell"` | id | Root page wrapper |
| `id="app-header"` | id | Logo / title block |
| `id="app-tab-bar"` | id | Horizontal tab strip |
| `id="app-content"` | id | Content area below tab bar |
| `.app-tab-bar` | class | Tab strip wrapper |
| `.tab-button` | class | Every tab button |
| `.tab-button--active` | class modifier | Active tab button |
| `id="tab-button-{tabId}"` | id | e.g. `tab-button-config` |
| `id="tab-panel-{tabId}"` | id | e.g. `tab-panel-output` |

**Cards**

| Selector | Type | Element |
|---|---|---|
| `.settings-card` | class | Standard white card |
| `.settings-card--compact` | modifier | Reduced-padding card variant |
| `id="settings-card-{name}"` | id | e.g. `settings-card-api-key` |
| `data-panel-id="{PanelId}"` | data attr | Links card to UiState.panels entry |
| `data-panel-hidden="true\|false"` | data attr | Visibility flag read by CSS |

**Fields**

| Selector | Type | Element |
|---|---|---|
| `.field-label` | class | `<label>` or section heading for a control |
| `.field-caption` | class | Help text below a control |
| `.field-input` | class | Text / password / number `<input>` |
| `.field-select` | class | `<select>` |
| `.field-textarea` | class | `<textarea>` |
| `.field-range` | class | Range slider `<input type="range">` |

**Toggle switch**

| Selector | Type | Element |
|---|---|---|
| `.toggle-switch` | class | `<button role="switch">` outer |
| `.toggle-switch__track` | class | Pill background span |
| `.toggle-switch__thumb` | class | Sliding dot span |
| `data-checked="true\|false"` | data attr | State flag read by CSS |

**Segmented buttons**

| Selector | Type | Element |
|---|---|---|
| `.segment-group` | class | Button group wrapper |
| `.segment-button` | class | Individual option |
| `data-selected="true\|false"` | data attr | Active state |

**Banners**

| Selector | Type | Element |
|---|---|---|
| `.status-banner` | class | Base notice wrapper |
| `.status-banner--warn` | modifier | Amber warning |
| `.status-banner--error` | modifier | Red error |
| `.status-banner--ok` | modifier | Green success |
| `id="banner-no-api-key"` | id | Specific banner instances |
| `id="banner-session-error"` | id | — |

**Action buttons**

| Selector | Type | Element |
|---|---|---|
| `.action-button--primary` | class | Full-width main CTA |
| `.action-button--secondary` | class | Contained secondary action |
| `.action-button--ghost` | class | Text-only button |
| `id="action-start-proofreading"` | id | Start session button |
| `id="action-test-connection"` | id | Test connection button |
| `id="action-export-json"` | id | Export results button |

**Result cards**

| Selector | Type | Element |
|---|---|---|
| `.result-card` | class | Base recommendation card |
| `.result-card--clean` | modifier | Green-tinted clean item |
| `.result-card--flagged` | modifier | Amber-tinted flagged item |
| `id="result-card-clean-{n}"` | id | e.g. `result-card-clean-0` |
| `id="result-card-flagged-{n}"` | id | e.g. `result-card-flagged-0` |

**Stats / debug**

| Selector | Type | Element |
|---|---|---|
| `id="stats-panel"` | id | Stats card wrapper |
| `.stats-grid` | class | 4-column metric grid |
| `.stats-cell` | class | Individual metric cell |
| `id="debug-panel-connection"` | id | Connection debug section |

---

## 5. Rollout Strategy

The seven phases below each have a defined scope and risk level. No phase depends on the one after it — they can be paused at any point without leaving the codebase in a broken state.

### Phase 1 — Token layer + selectors *(zero visual change, zero risk)*

Apply: `types/uiConfig.ts`, `config/uiConfig.ts`, `lib/uiSelectors.ts`, `index.css` (tokens only), `tailwind.config.ts` (retire v3 content array).

Result: Design tokens defined, selector vocabulary established, CSS custom properties available. No component touches anything yet.

### Phase 2 — AppContext UiState slice *(minimal risk)*

Apply: Updated `AppContext.tsx` (full replacement).

Result: UiState lives in context with 6 new action types. Nothing reads it yet. The reducer is pure; no side effects are introduced. The existing AppState shape is extended, not changed.

### Phase 3 — App.tsx: semantic ids + dir wiring + Appearance tab *(low risk)*

Apply: Updated `App.tsx`.

Result: Tab buttons get `id` and semantic `className`. The tab content wrapper receives the `dir` attribute. The Appearance tab appears behind the `IS_DEV` guard. Visual identity is unchanged.

### Phase 4 — Semantic CSS component layer *(zero risk)*

Apply: The `@layer components {}` block in `index.css`.

Result: `.settings-card`, `.tab-button`, `.toggle-switch`, `.action-button--*`, `.status-banner`, `.result-card`, `.stats-grid` and all other semantic classes are available. Nothing uses them yet.

### Phase 5 — Component selector pass *(low risk)*

Apply: `ConfigTab.tsx`, `InputTab.tsx`, `OutputTab.tsx`, `ConnectionPanel.tsx`, `UsageMonitor.tsx`, `ChunkProgressList.tsx` — one file at a time.

Each file is a search-and-replace of class strings plus added `id` and `data-*` attributes. No logic changes. Apply and verify in the browser after each file.

### Phase 6 — Accessibility fixes *(low to medium risk)*

Apply: Toggle `div` → `<button role="switch">` in ConfigTab; `aria-hidden` emoji in all headings; `<dl>/<dt>/<dd>` in OutputTab stats and result cards; `:focus-visible` in `index.css`.

Test keyboard navigation and screen reader flow after this phase. The DOM structure changes in stats and result cards are the highest-risk changes in the entire rollout.

### Phase 7 — UiTab scaffold *(dev-only, no production risk)*

Apply: `UiTab.tsx`.

Result: Appearance tab renders with skin picker, density selector, direction controls, and panel visibility toggles. Fully functional and dev-only until the team decides to graduate it to production.

---

## 6. Files Affected Summary

| File | Status | Summary of changes |
|---|---|---|
| `src/types/uiConfig.ts` | **NEW** | UiState, UiSkin, PanelId, UiDirConfig type shapes |
| `src/config/uiConfig.ts` | **NEW** | UI_DEFAULTS, SKIN_OPTIONS, DENSITY_OPTIONS |
| `src/lib/uiSelectors.ts` | **NEW** | CLS, IDS, QUERY, DATA semantic selector constants |
| `src/components/tabs/UiTab.tsx` | **NEW** | 🎨 Appearance tab (dev-only) |
| `src/context/AppContext.tsx` | CHANGE | Added UiState slice + 6 new action types |
| `src/index.css` | CHANGE | @theme tokens, skin/density overrides, panel visibility, @layer components |
| `tailwind.config.ts` | CHANGE | Retired v3 content array (inert in v4) |
| `src/App.tsx` | CHANGE | Semantic ids, dir wiring, Appearance tab wiring |
| `src/components/tabs/ConfigTab.tsx` | CHANGE | Selectors, a11y, token refs, panel wiring |
| `src/components/tabs/InputTab.tsx` | CHANGE | Selectors, a11y, token refs |
| `src/components/tabs/OutputTab.tsx` | CHANGE | Selectors, dl stats, a11y |
| `src/components/tabs/PlaygroundTab.tsx` | CHANGE (patch) | Selector pass only — patch notes in handoff |
| `src/components/shared/ConnectionPanel.tsx` | CHANGE | Selectors, debug panel data-attrs |
| `src/components/shared/UsageMonitor.tsx` | CHANGE | Selectors, a11y (progress bar role) |
| `src/components/shared/ChunkProgressList.tsx` | CHANGE | Selectors, a11y (ol + aria-live) |

**Zero breaking changes.** All existing logic, session handling, and API calls are untouched. UiState is additive to AppState. New CSS classes are opt-in. The Appearance tab has no production exposure.
