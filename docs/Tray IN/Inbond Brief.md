

# Inbond Brief

Date: 2026-06-20
Project: `cohere-proofreader`
Responding to: Proxy Track Response and Next Assignment



## Task 1 — Audit findings

**Every settings write goes through one path:** `ConfigTab.tsx`'s local `set()` helper calls `dispatch({ type: "SET_CFG", cfg: patch })`, which lands in `AppContext.tsx`'s reducer:

```ts
case "SET_CFG":
  return { ...state, cfg: { ...state.cfg, ...action.cfg } };
```

This is a blanket merge with **zero awareness of `state.cfg.tier`**. It will happily apply any patch regardless of current tier. This is the single point where enforcement needs to live, because every UI control in `ConfigTab.tsx` — temperature, seed, thinking toggle, max chunk chars, multi-turn, custom instructions mode/text, model — funnels through this exact same `set()` → `SET_CFG` path with no exceptions. There is no second write path to audit; that's actually good news for the fix.

**`switchTier()` is also unguarded** — it dispatches `PRODUCTION_DEFAULTS` wholesale via the same `SET_CFG` action, meaning switching tiers and then immediately changing one field both go through the identical, unrestrained reducer case.

**Tier-conditional UI logic that exists today is purely decorative:** the only tier-aware rendering in `ConfigTab.tsx` is the amber Cohere-sales note shown `{cfg.tier === "production" && ...}`. Every other control — including the inputs immediately below that note — renders and accepts input identically in both tiers. So your report's framing is precisely accurate: tiering is cosmetic, not enforced.

**`proofreadingSession.ts` doesn't gate anything either, but for a different reason — it doesn't need to.** It reads whatever `cfg` it's handed and acts on it faithfully (e.g. `isFinite(cfg.requestsPerMinute)` correctly treats Production's `Infinity` as "no throttle"). This file is downstream of the config, not a place where tier rules belong — if `cfg` is correct by the time it reaches here, this file requires no changes. I'm flagging this explicitly because it was in the audit list but the right finding is "not a touch point," not "needs a guard."

**`featureConfig.ts` (both type and config files)** define the shape and the two preset objects but contain no editability metadata at all — nothing currently encodes *which* fields are tier-locked. That has to be added somewhere, and it's the natural place for it.

## Task 2 — Implementation strategy

The smallest correct fix is a single new helper plus one reducer-level guard — not a UI redesign.

### 1. New: a field-editability map, co-located with the presets

In `src/config/featureConfig.ts`, add:

```ts
// Fields a Production-tier user may still adjust. Everything else is
// locked to PRODUCTION_DEFAULTS once tier === "production".
// Centralizing this as data (not scattered conditionals) means ConfigTab,
// the reducer guard, and any future surface (Playground, API) all read
// the same source of truth.
export const PRODUCTION_EDITABLE_FIELDS: ReadonlyArray<keyof FeatureConfig> = [
  "customInstructions",       // editorial layer only — structural layer still enforced downstream
  "customInstructionsMode",
  // Deliberately NOT included: modelId, temperature, seed, thinkingDisabled,
  // maxChunkChars, maxOutputTokens, multiTurn, requestsPerMinute,
  // monthlyCallCeiling, tier itself.
];
```

This list is the actual product decision — I've defaulted to "only custom instructions stay editable in Production," which matches the spirit of your existing `customInstructionsMode` design (additive/override was already built as the safe, user-facing lever). Worth confirming this is the right line before implementing — it's a one-array change either way.

### 2. Reducer-level enforcement (the part that makes it real, not cosmetic)

In `AppContext.tsx`, change only the `SET_CFG` case:

```ts
import { PRODUCTION_EDITABLE_FIELDS } from "../config/featureConfig";

case "SET_CFG": {
  // Tier switches (action.cfg.tier present) always pass through untouched —
  // switching tiers is how you'd ever get OUT of a locked state.
  if (action.cfg.tier) {
    return { ...state, cfg: { ...state.cfg, ...action.cfg } };
  }

  if (state.cfg.tier === "production") {
    const filtered: Partial<FeatureConfig> = {};
    for (const key of Object.keys(action.cfg) as Array<keyof FeatureConfig>) {
      if (PRODUCTION_EDITABLE_FIELDS.includes(key)) {
        (filtered as any)[key] = action.cfg[key];
      }
    }
    return { ...state, cfg: { ...state.cfg, ...filtered } };
  }

  return { ...state, cfg: { ...state.cfg, ...action.cfg } };
}
```

This is the load-bearing change. Once this is in, **no write path can mutate a locked field while `tier === "production"`**, regardless of what any component does — including future components you haven't built yet, like the Playground tab's config controls if it ever gets them. That's the actual difference between "enforced" and "the button happens to be disabled today."

### 3. UI: disable the controls, driven by the same array

In `ConfigTab.tsx`, add one helper and use it to gate the existing inputs — no new components, no restructuring:

```ts
const isLocked = (field: keyof FeatureConfig) =>
  cfg.tier === "production" && !PRODUCTION_EDITABLE_FIELDS.includes(field);
```

Then on each locked control, add `disabled={isLocked("temperature")}` (etc.) and a conditional class for the disabled look, e.g.:

```tsx
<input
  type="range" min={0} max={1} step={0.05} value={cfg.temperature}
  disabled={isLocked("temperature")}
  onChange={e => set({ temperature: Number(e.target.value) })}
  className={`w-full accent-[#1c2b4a] ${isLocked("temperature") ? "opacity-40 cursor-not-allowed" : ""}`}
/>
```

This is cosmetic on its own — but paired with step 2, disabling the control is now a UX courtesy, not the actual security boundary. That ordering matters: if you only ship step 3, you're back to where you are today (a determined user can still fire `dispatch` manually via devtools or a future code path). Step 2 is what makes step 3 honest.

I'd add one small inline note near locked controls (reusing your existing amber-note pattern) — something like *"Locked in Production — switch to Testing to adjust"* — rather than just greying things out silently, since silent disabling is more confusing than a one-line reason.

### Why this is the minimal-safe version, not a redesign

- **One array** is the single product decision surface — extending or shrinking what's Production-editable later is a one-line change, not a refactor.
- **One reducer branch** is the entire enforcement mechanism — it composes with everything: Playground (if it ever writes `cfg`), a future settings-import feature, anything.
- **No new state shape, no new context, no new files.** `FeatureConfig` itself stays untouched — editability is metadata *about* the type, not a change *to* the type, which avoids touching `proofreadingSession.ts` or `types/featureConfig.ts` at all, consistent with your "avoid unless truly needed" list.
