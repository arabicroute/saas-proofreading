# UI Co-Designer Brief - Layout Theme and Component Audit

Date: 2026-06-20
Project: `cohere-proofreader`
Shared repository: `https://github.com/arabicroute/saas-proofreading/tree/main`
## Shared Repo Links

These are the primary GitHub links you most likely need access to.

### Repository roots

- Repo root: [saas-proofreading](https://github.com/arabicroute/saas-proofreading/tree/main)
- `src/`: [src](https://github.com/arabicroute/saas-proofreading/tree/main/src)
- `src/components/`: [components](https://github.com/arabicroute/saas-proofreading/tree/main/src/components)
- `src/components/tabs/`: [tabs](https://github.com/arabicroute/saas-proofreading/tree/main/src/components/tabs)
- `src/components/shared/`: [shared](https://github.com/arabicroute/saas-proofreading/tree/main/src/components/shared)
- `src/config/`: [config](https://github.com/arabicroute/saas-proofreading/tree/main/src/config)
- `src/context/`: [context](https://github.com/arabicroute/saas-proofreading/tree/main/src/context)
- `src/types/`: [types](https://github.com/arabicroute/saas-proofreading/tree/main/src/types)

### Core app shell

- `src/App.tsx`: [App.tsx](https://github.com/arabicroute/saas-proofreading/blob/main/src/App.tsx)
- `src/main.tsx`: [main.tsx](https://github.com/arabicroute/saas-proofreading/blob/main/src/main.tsx)
- `src/index.css`: [index.css](https://github.com/arabicroute/saas-proofreading/blob/main/src/index.css)

### Tabs

- `src/components/tabs/ConfigTab.tsx`: [ConfigTab.tsx](https://github.com/arabicroute/saas-proofreading/blob/main/src/components/tabs/ConfigTab.tsx)
- `src/components/tabs/InputTab.tsx`: [InputTab.tsx](https://github.com/arabicroute/saas-proofreading/blob/main/src/components/tabs/InputTab.tsx)
- `src/components/tabs/OutputTab.tsx`: [OutputTab.tsx](https://github.com/arabicroute/saas-proofreading/blob/main/src/components/tabs/OutputTab.tsx)
- `src/components/tabs/PlaygroundTab.tsx`: [PlaygroundTab.tsx](https://github.com/arabicroute/saas-proofreading/blob/main/src/components/tabs/PlaygroundTab.tsx)

### Shared components

- `src/components/shared/ConnectionPanel.tsx`: [ConnectionPanel.tsx](https://github.com/arabicroute/saas-proofreading/blob/main/src/components/shared/ConnectionPanel.tsx)
- `src/components/shared/ChunkProgressList.tsx`: [ChunkProgressList.tsx](https://github.com/arabicroute/saas-proofreading/blob/main/src/components/shared/ChunkProgressList.tsx)
- `src/components/shared/UsageMonitor.tsx`: [UsageMonitor.tsx](https://github.com/arabicroute/saas-proofreading/blob/main/src/components/shared/UsageMonitor.tsx)

### State and config

- `src/context/AppContext.tsx`: [AppContext.tsx](https://github.com/arabicroute/saas-proofreading/blob/main/src/context/AppContext.tsx)
- `src/config/featureConfig.ts`: [featureConfig.ts](https://github.com/arabicroute/saas-proofreading/blob/main/src/config/featureConfig.ts)
- `src/types/featureConfig.ts`: [featureConfig.ts](https://github.com/arabicroute/saas-proofreading/blob/main/src/types/featureConfig.ts)

### Styling and build context

- `tailwind.config.ts`: [tailwind.config.ts](https://github.com/arabicroute/saas-proofreading/blob/main/tailwind.config.ts)
- `vite.config.ts`: [vite.config.ts](https://github.com/arabicroute/saas-proofreading/blob/main/vite.config.ts)
- `package.json`: [package.json](https://github.com/arabicroute/saas-proofreading/blob/main/package.json)

### Helpful reference docs

- Project guide: [cohere-proofreader - Project Guide.md](https://github.com/arabicroute/saas-proofreading/blob/main/cohere-proofreader%20-%20Project%20Guide.md)


## Assignment Summary

You are asked to audit the current app UI and propose a compact, accessible, and more intuitive design direction that can be implemented inside the existing React + Vite + Tailwind codebase.

You may ask me to run manual testing and report results to you. Your work for this assignment is code-first analysis plus a repo-accurate implementation proposal delivered through a shared `*.ts` source file for me to apply.

## Your Objectives

### 1. Audit the current UI

Review the current:

- layout density
- visual hierarchy
- card structure
- spacing rhythm
- color usage
- tab navigation clarity
- typography and RTL treatment
- accessibility risks
- affordance and discoverability of major controls

Primary goal:

- advise how to make the UI more compact, accessible, and intuitive without turning this into a full redesign or changing the product scope

### 2. Define a new UI-management tab

Design a new app tab dedicated to UI management.

This new tab should cover, at minimum:

- style presets / skins / visual modes
- visibility toggles for major UI sections, cards, or panels
- a clean structure for future UI preferences

You are not required to implement the tab directly, but you must provide a concrete implementation proposal and the repo-accurate source scaffolding needed for me to implement it.

### 3. Introduce meaningful design selectors

Audit the current markup and propose a design-driven layer of semantic `className` and `id` hooks for important UI elements.

The goal is to move away from purely utility-only selectors such as:

```html
<button class="flex-1 py-3 text-xs font-semibold border-b-2 transition-colors relative border-[#1c2b4a] text-[#1c2b4a]">✏ Input</button>
```

Toward markup that preserves Tailwind utilities while adding meaningful design hooks such as:

```html
<button id="tab-button-input" class="tab-button flex-1 py-3 text-xs font-semibold border-b-2 transition-colors relative border-[#1c2b4a] text-[#1c2b4a]">✏ Input</button>
```

Your selector plan should:

- use names that are meaningful from a design-system perspective
- support visibility and state management
- support future theming / styling overrides
- avoid noisy or arbitrary naming
- be consistent across tabs, cards, buttons, banners, and major content sections

## Constraints

- Assume you can access only the shared GitHub repository.
- Do not assume local runtime access.
- Do not assume manual testing access.
- Do not assign browser testing or server verification tasks.
- Stay anchored to the actual repo structure and current files.
- Keep recommendations implementation-friendly; avoid abstract design theory without file-level guidance.

## Required Deliverables

Please deliver **both** of the following:

### Deliverable 1. Written audit and recommendation summary

Include:

- the main layout and usability issues you found
- compactness improvements
- accessibility improvements
- navigational / component discoverability improvements
- recommended structure for the new UI-management tab
- recommended selector naming approach
- the smallest safe rollout strategy

### Deliverable 2. Shared `*.ts` source file

Provide a TypeScript source file containing the proposed added and changed files.

That file should include:

- file-by-file notes
- proposed new files
- proposed changed files
- code scaffolding, snippets, or full replacements where appropriate
- any new type shapes, config objects, tab definitions, and UI metadata needed

The output should be in the same practical style used in prior shared `*.ts` handoff files so it can be reviewed and applied repo-side.

## Current UI Architecture

The app is a single-page React interface with top-level tab switching controlled by context state rather than routing.

Current top-level tabs:

- `config`
- `input`
- `output`
- `playground` (dev-only)

The current shell is:

- a centered narrow column layout
- a top header
- a horizontal tab strip
- one active tab rendered at a time

Styling is currently driven mostly by inline Tailwind utility classes plus a very small global CSS layer. There is no real design-token layer, no reusable semantic class system, and no dedicated appearance/settings tab yet.

## Current UI Characteristics To Evaluate

Please pay special attention to these themes:

- repeated hard-coded brand colors such as `#1c2b4a`
- repeated card shells such as `rounded-xl bg-white p-5 shadow-sm`
- small-text-heavy controls and labels
- custom toggle controls implemented with clickable `div`s
- dense configuration surfaces
- mixed Arabic/English labels and typography
- result card readability
- semantic weakness of current selectors
- lack of centralized theme or component metadata

## Requested Design Direction

Please keep the design direction practical and incremental.

Preferred characteristics:

- more compact use of space
- better readability and hierarchy
- stronger consistency across cards and controls
- more accessible component patterns
- better semantic structure for future styling control
- a clear place to manage UI presentation preferences

Please avoid:

- large product-flow rewrites
- router-based redesigns
- speculative backend work
- manual QA instructions
- recommendations that require a visual testing environment you cannot access

## Recommended Areas To Touch

You should inspect and, where appropriate, propose changes for:

- app shell and tab bar
- tab buttons and active/inactive states
- cards and section wrappers
- form controls
- toggles and control groups
- alert / warning / success banners
- result cards
- stats panels
- debug panels
- visibility control metadata
- future skin/theme configuration structure

## Expected New UI Tab Scope

Your proposal for the new UI-management tab should address:

- where the tab should live in the tab order
- suggested tab name
- what settings belong there versus elsewhere
- how style presets / skins should be represented
- how card or panel visibility toggles should be stored
- whether a central UI config object or state slice should be introduced
- how the tab should coexist with the existing `config` tab

## Selector Naming Guidance

Please propose a consistent naming pattern for meaningful UI selectors.

Suggested examples only:

- `tab-button`
- `tab-panel`
- `app-shell`
- `app-header`
- `settings-card`
- `status-banner`
- `primary-action-button`
- `result-card`
- `result-card-flagged`

Suggested ID style:

- `tab-button-config`
- `tab-button-input`
- `tab-button-output`
- `settings-card-connection`
- `settings-card-inference`
- `result-card-clean-1`

Please improve this scheme if you see a better one, but keep it coherent and implementation-friendly.

## Files Most Likely To Be Affected

- `src/App.tsx`
- `src/index.css`
- `src/context/AppContext.tsx`
- `src/config/featureConfig.ts`
- `src/components/tabs/ConfigTab.tsx`
- `src/components/tabs/InputTab.tsx`
- `src/components/tabs/OutputTab.tsx`
- `src/components/tabs/PlaygroundTab.tsx`
- `src/components/shared/ConnectionPanel.tsx`
- `src/components/shared/ChunkProgressList.tsx`
- `src/components/shared/UsageMonitor.tsx`
- `tailwind.config.ts`
- `vite.config.ts`

Potential new files are acceptable if justified, for example:

- `src/components/tabs/UiTab.tsx`
- `src/config/uiConfig.ts`
- `src/types/uiConfig.ts`
- `src/lib/uiSelectors.ts`

## Handoff Expectations

Please keep your response repo-accurate.

I need:

- clear design audit findings
- a practical rollout strategy
- a `*.ts` source handoff with proposed changes
- no manual testing checklist


## Closing Note

Please begin by reviewing the linked files above before asking follow-up questions about source access. The repo links are the working source of truth for this assignment.
