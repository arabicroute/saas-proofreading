# Migration Notes — UI Audit Handoff
**Repo:** `arabicroute/saas-proofreading`  
**Handoff file:** `ui-audit-handoff.ts`  
**Companion report:** `ui-audit-report.md`

---

## How to read the handoff file

`ui-audit-handoff.ts` is a single TypeScript file containing all proposed code as **template literal strings** assigned to named exports. Each export is named `_fileNameCamelCase` and maps to one file path.

To apply a file, copy the content of the template literal (everything between the opening backtick and the closing backtick of that export) into the target path.

**Example:**
```ts
export const _indexCss = `   ← start of template literal
/* ... css content ... */
`;                            ← end of template literal
```
Copy everything between the backticks into `src/index.css`.

---

## Step-by-step application guide

Work through the files in the order below. Each step is independent — if you stop after any step, the app will still build and run correctly.

---

### Step 1 — Create `src/types/uiConfig.ts`

Source export in handoff: `_uiConfigTypes`

This is a pure type file. No runtime imports. Create it as a new file — it does not replace anything.

---

### Step 2 — Create `src/config/uiConfig.ts`

Source export in handoff: `_uiConfigDefaults`

Contains `UI_DEFAULTS` (the factory-reset values for the appearance system), `SKIN_OPTIONS`, and `DENSITY_OPTIONS`. New file.

---

### Step 3 — Create `src/lib/uiSelectors.ts`

Source export in handoff: `_uiSelectors`

Contains the `CLS`, `IDS`, `QUERY`, and `DATA` selector constant objects. New file. Nothing imports it yet at this point — that happens in later steps.

---

### Step 4 — Replace `src/context/AppContext.tsx`

Source export in handoff: `_appContextDiff`

The handoff provides both a diff summary and a complete file replacement. **Use the complete replacement** — the full updated `AppContext.tsx` is the block starting with `// FULL UPDATED FILE` inside `_appContextDiff`. Copy that block verbatim.

What changes: the `AppState` interface gains a `ui: UiState` field; `initialState` gains `ui: UI_DEFAULTS`; six new action types are added to `AppAction`; six new reducer cases handle them. All existing cases are identical to the original.

> **Verification:** After this step, `npm run build` (or `vite build`) should pass with no type errors, since nothing reads `ui` yet.

---

### Step 5 — Replace `src/index.css`

Source export in handoff: `_indexCss`

This is a **full replacement** of the existing file. The original `index.css` content (`@import "tailwindcss"` plus the `arabic-text` rule) is preserved and extended. Do not merge — replace entirely.

What is added: `@theme {}` block with all design tokens, skin override blocks (`[data-skin="warm"]` etc.), density override block, panel visibility rule (`[data-panel-hidden="true"]`), `@layer base {}` with `:focus-visible` and RTL input rules, `@layer components {}` with all semantic class definitions, `@layer utilities {}` with `.sr-only`.

> **Verification:** The app should look visually identical at this point. The new classes exist but nothing uses them yet. The `arabic-text` class still applies as before.

---

### Step 6 — Replace `tailwind.config.ts`

Source export in handoff: `_tailwindConfig`

Short replacement. The `content` array is removed (it is inert in Tailwind v4 — content scanning is handled by `@tailwindcss/vite`). The `future.hoverOnlyWhenSupported` flag is kept.

> **Note:** If your build setup uses the `content` array for anything outside of Tailwind (unlikely but possible), keep it — its presence does not break Tailwind v4.

---

### Step 7 — Replace `src/App.tsx`

Source export in handoff: `_appTsx`

What changes: imports `UiTab`, `CLS`, `IDS`, `DATA` from the new files; adds the `DisplayTab` local type; adds `displayTab` local state to handle the Appearance tab without touching `AppTab`; tab buttons get `id`, `role="tab"`, `aria-selected`, and semantic class names; the active tab content wrapper gets `dir={activeDir}`; the `data-skin` and `data-density` attributes are applied to `#app-shell`.

> **Verification:** The four original tabs should work identically. In `DEV` mode, an "🎨 Appearance" tab should now appear (and "🛠 Playground" if it was already visible). Both render only when `IS_DEV` is true.

---

### Step 8 — Create `src/components/tabs/UiTab.tsx`

Source export in handoff: `_uiTabTsx`

The Appearance tab component. New file. Contains the `UiTab` export and the `PanelToggleRow` sub-component.

> **Verification:** Open the app in dev mode and navigate to the Appearance tab. You should see: a color skin picker with three options, a density selector, a direction section with global and per-tab controls, a panel visibility section grouped by Config / Output, and a reset button at the bottom.

---

### Step 9 — Replace `src/components/tabs/ConfigTab.tsx`

Source export in handoff: `_configTabTsx`

Full replacement. Logic is identical to the original. Changes are: semantic ids and class names, panel wiring (`data-panel-id` / `data-panel-hidden`), accessible headings, toggle divs replaced with switch buttons, segment groups, field classes, color token refs.

> **Verification:** All ConfigTab controls should operate identically. Toggle switches should now be keyboard-operable with Space/Enter. Hiding a panel from the Appearance tab should hide the corresponding Config card.

---

### Step 10 — Replace `src/components/tabs/InputTab.tsx`

Source export in handoff: `_inputTabTsx`

Full replacement. Logic is identical. Changes are: semantic ids, banner classes, field classes, action button class, `aria-label` on textarea, `aria-busy` on submit button.

---

### Step 11 — Replace `src/components/tabs/OutputTab.tsx`

Source export in handoff: `_outputTabTsx`

Full replacement. Logic is identical. Changes are: semantic ids, `<dl>/<dt>/<dd>` for stats and recommendation cards, panel visibility wiring on stats / clean / flagged sections, `role="progressbar"` replaced by `<dl>` pattern, collapsible flagged section now uses `aria-expanded`.

---

### Step 12 — Replace `src/components/shared/ConnectionPanel.tsx`

Source export in handoff: `_connectionPanelTsx`

Full replacement. Logic is identical. Changes are: semantic ids, `role="status"` + `aria-live="polite"` on the indicator row, action button class, debug panel `data-panel-hidden` wiring.

---

### Step 13 — Replace `src/components/shared/UsageMonitor.tsx`

Source export in handoff: `_usageMonitorTsx`

Full replacement. Logic is identical. Changes are: semantic ids, `role="progressbar"` with `aria-valuenow/min/max` on the usage bar, panel visibility wiring, `CLS.actionGhost` on the reset button.

---

### Step 14 — Replace `src/components/shared/ChunkProgressList.tsx`

Source export in handoff: `_chunkProgressListTsx`

Full replacement. Logic is identical. Changes are: `<ol>` instead of plain `<div>` list (chunk order is meaningful), `aria-live="polite"` on wrapper, `aria-label` on each list item, decorative icon marked `aria-hidden`.

---

### Step 15 — Patch `src/components/tabs/PlaygroundTab.tsx`

Patch notes in handoff: `_playgroundTabPatch`

PlaygroundTab is not provided as a full replacement because its internals vary by experiment. The patch notes list five targeted replacements to apply manually: add the import, add the outer wrapper `id`, replace card shell classes, replace color tokens, and replace action button classes.

---

## Tailwind v4 configuration note

In Tailwind v4, design tokens belong in `@theme {}` inside your CSS file — not in `tailwind.config.ts`. The `tailwind.config.ts` file is still valid but the `content` array is inert (the Vite plugin handles content detection automatically via the module graph). The `@theme {}` block in `index.css` is the single source of truth for all color, spacing, and typography tokens.

If you see a Tailwind warning about the `content` option, you can safely remove it from `tailwind.config.ts` entirely.

---

## Verification checklist after full application

Run through these after completing all steps:

- [ ] `npm run build` passes with no TypeScript errors
- [ ] All four original tabs (Config, Input, Output, Playground) work identically to before
- [ ] 🎨 Appearance tab is visible in dev mode and hidden in production build
- [ ] Skin picker changes the `data-skin` attribute on `#app-shell` and visually shifts the navy color
- [ ] Density toggle changes `data-density` on `#app-shell` and visibly reduces card padding
- [ ] Global direction toggle changes `dir` on `#app-content` for the active tab
- [ ] Panel visibility toggles hide/show the corresponding cards without losing form state
- [ ] All toggle switches are keyboard-operable (Tab to focus, Space to toggle)
- [ ] Focus ring is visible on all interactive elements when navigating by keyboard
- [ ] Screen reader announces toggle switches as "switch, checked/unchecked" with a name
- [ ] Stats in Output tab are announced as definition list items (test with VoiceOver/NVDA)
- [ ] ChunkProgressList announces chunk status updates via `aria-live` region

---

## What is NOT changed by this handoff

- No proofreading session logic (`lib/proofreadingSession.ts`)
- No API client logic (`lib/cohereClient.ts`)
- No usage counter logic (`lib/usageCounter.ts`)
- No feature config values (`config/featureConfig.ts`, `types/featureConfig.ts`)
- No vite configuration (`vite.config.ts`)
- No package dependencies
- No server / proxy code
- No existing TypeScript types outside `AppContext.tsx`
