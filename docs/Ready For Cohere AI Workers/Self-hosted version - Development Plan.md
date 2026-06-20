
# Development Plan: Cohere-Enhanced Arabic Proofreader

## Selected AI Model App-friendly Features & Challenges

### `command-r7b-arabic-02-2025` Model for multi-step tool use + state: needs verification before adoption

Two separate claims to unbundle:

**a) Multi-step tool use / conversation state** — API availability confirmed real and well-documented, but it's a **Chat API feature available across Command models generally** (the docs page covers it model-agnostically, demonstrated with `command-a-03-2025`), not something unique to the Arabic R7B variant. The mechanism: the Chat endpoint supports a `while` loop pattern where the model can request tool calls across multiple sequential steps before producing a final answer, with `messages` accumulating `assistant`→`tool` pairs each round. This is architecturally interesting for your app, but **tool use solves a different problem than the one you're using chunking for** — it's for letting the model *call functions* (search, lookups, calculators), not for managing a long proofreading job. Worth being precise about this distinction in the plan so the two ideas (tool use vs. chunked turns) don't get conflated.

**b) `command-r7b-arabic-02-2025` itself** — this model **exists and is real**

**Actionable items:**
- [ ] Treat multi-step tool use and chunked multi-turn as two separate, non-conflicting mechanisms in the architecture — not a replacement for the chunking design already validated


### 20 req/min cap with Testing/Production toggle: confirmed correct, directly implementable

Cohere's own rate-limits documentation confirms your number exactly: **trial keys are limited to 20 requests/minute** on Command A+ specifically (and all Command A-family models), alongside a **1,000 calls/month** trial cap that's worth surfacing in the app too, since it's a second ceiling independent of the per-minute one. Production keys for Command A+ aren't self-serve — they require contacting Cohere sales, which is itself a useful thing to surface in a "Production" mode's setup flow (e.g., a note rather than an assumption that production = unlimited).

**Actionable items:**
- [ ] Add a "Testing / Production" mode toggle to the Configuration tab
- [ ] In Testing mode: client-side request throttling/queueing to stay under 20 req/min (e.g., a simple token-bucket or sliding-window limiter wrapping the fetch calls)
- [ ] Surface the 1,000 calls/month trial ceiling somewhere visible (e.g., a running counter, since this is a monthly not per-session limit, it likely needs to persist — which conflicts with the "no localStorage" constraint in the current artifact environment, but is a non-issue in your self-hosted Vite app where you control storage)
- [ ] In Production mode: skip the throttle, but display a note that Command A+ production access requires contacting Cohere sales rather than just "having a paid key"

## Significant App Features

### Modular, plan-gated architecture: feasible and good practice, scope it carefully

This is sound product architecture and very implementable, but it's the most open-ended item, so it benefits from explicit scoping rather than being designed all at once.

**Feasible sub-components:**
- **Feature modules mapped to settings flags** — straightforward in React: a config object (e.g., `{ multiTurn: bool, maxInputChars: number, maxOutputChars: number, callsPerMinute: number }`) driving which UI elements and request behaviors are active. This is a clean, standard pattern (feature-flagging), not exotic.
- **Plan-based limits (input/output length caps, multi-turn on/off, calls/min)** — all mechanically enforceable client-side once the config object exists; each is just a guard clause at the point where text is submitted or a request is queued.
- **Dev-only Playground-like tab** — reasonable for a self-hosted dev build; this is essentially a raw request/response inspector. Worth keeping clearly separated from the production build (e.g., conditionally rendered based on a build-time env flag) so it doesn't ship to end users.
- **Dev-only add/revoke tokens in client storage** — reasonable for local development, since you're self-hosting and not bound by the artifact sandbox's no-localStorage rule. **Important distinction to carry into the plan:** for an actual production deployment, API tokens should not live in client-side storage at all (even encrypted) — they belong behind a backend proxy that holds the real Cohere key server-side, with the client authenticating to *your* backend instead. The dev-mode local-storage token approach is fine for solo testing but should be explicitly scoped as dev-only, not a stepping stone to production auth.

**Actionable items:**
- [ ] Define a `FeatureConfig` shape early (input/output char limits, multi-turn toggle, rate limit, KB/no-KB toggle) as the single source of truth different "plans" map onto
- [ ] Build a Settings-driven UI that reads from this config rather than hardcoding tab visibility/behavior
- [ ] Add a dev-only "Playground" tab (raw request builder + response viewer) gated behind a build flag, not shipped to production
- [ ] Add dev-only token management UI using client storage, explicitly labeled as a development convenience
- [ ] Document (even just as a comment/README note) that production token handling needs a server-side proxy — this is a separate, larger piece of work from the rest of the plan and shouldn't be implied as "done" by the dev-mode token UI

---

## Consolidated Development Plan

Please see attachements for System Prompt, JSON Schemes, and Scaffolding JS

### Phase 1 — Core migration (foundation)
**default model:** `command-r7b-arabic-02-2025`. Keep Command A+ as a configurable fallback/comparison option — cheap to support both as a model-string setting, and useful if R7B Arabic underperforms on harder real-world documents later.
Since AI models are not craved on stone as the game rules changes over time, it's a good practice to have a model selection dropdwon list. Also it's a future-ready feature to to incorporate proxy AI model-specific modules. That means adding custom middleware between the  application and various AI providers (like OpenAI API or Claude). This allows the app to standardize inputs, manage traffic centrally, enforce rules, and switch underlying models without changing the core codebase  

1. Stand up Vite/React project structure
2. Port the existing chunking + multi-turn logic (system prompt sent once, chunks appended as user turns, `=== المقطع الحالي ===` delimiters)
3. Port the finalized 8-rule system prompt with minimal-pair examples
4. Implement Cohere Chat API V2 calls (`messages` array, JSON mode without schema, `thinking: disabled`, `temperature: 0.4`, `seed: 42`)
5. Port the consistency-check post-processing module (no-op filter + leaked-span flagging)

### Phase 2 — Production guardrails
6. Implement Testing/Production mode toggle
7. Client-side rate limiter (20 req/min cap in Testing mode)
8. Monthly call counter (1,000/month trial visibility)
9. Connection test / debug panel (already designed, carries over directly)

### Phase 3 — Modular feature architecture
10. Define `FeatureConfig` schema for plan-based gating
11. Wire input/output length caps, multi-turn toggle, and rate limits to this config
12. Settings UI to view/adjust config (dev mode: freely editable; production: plan-driven, read-only)

### Phase 4 — Developer tooling (dev-build only)
13. Playground-style raw request/response inspector tab
14. Local token add/revoke UI (client storage, dev-only)
15. Explicit build-flag separation between dev and production bundles

### Phase 5 — Investigation track (parallel, not blocking)
16. run the full defect checklist (hedging, diacritics, no-op, side-effects, scope-cleanup) against R7B Arabic specifically.
17. Validate Arabic-keyed JSON Schema mode against the real API (not just Playground UI) — carried over from the prior handoff report's open question
18. Design server-side token proxy architecture for eventual real production deployment (separate workstream, larger scope)
19. Set AI config. defaults: (`thinking: off`, JSON mode: yes with scheme left bland, `seed: 43`, temperature: .4) matches what the prompt/architecture assumes

---

## Questions / Food for Thought

1. **Should the modular plan-gating system be built generically now, or deferred until you have at least two real plan tiers to validate the abstraction against?** Building it against a single tier risks over-engineering the config shape before you know what actually varies between plans.
2. **On the monthly 1,000-call trial ceiling** — should the app track this locally (imperfect, resettable by clearing storage) or is it worth a lightweight backend even at the testing stage just to get an authoritative count? This is a preview of the larger "you'll eventually need a backend" question raised by the token-security point above — worth deciding if that backend arrives now or later.


# Plan Addendum: System Prompt Management (Dev & Production)

## Rationale

No system prompt fully anticipates every real-world input. Prompt refinement is an ongoing process driven by observed failures (e.g., the diacritics-ambiguity case), not a one-time deliverable. The app's architecture should reflect this explicitly rather than treating the system prompt as a fixed constant — with two different needs at two different stages:

- **Dev stage:** fast iteration, raw editability, no guardrails needed since only the developer is affected.
- **Production stage:** controlled extensibility — end users can adapt model behavior to their documents without being able to break the app's structural contract (valid JSON shape, anchor/correction field requirements) that the parser and consistency-check logic depend on.

---

## Part A — Dev-stage: externalized prompt file + edit UI

### Structure
- System prompt lives in `src/prompts/systemPrompt.ar.md` (or `.txt`), not inline in component code.
- Imported via Vite's raw-text import: `import systemPrompt from './prompts/systemPrompt.ar.md?raw'`.
- Dev-only "Playground" tab (already scoped in Phase 4) gets a prompt-editing panel: a textarea pre-populated from the imported file, with a "Run test chunk" action that uses the in-memory edited version for that session.

### Persistence constraint
A browser-only Vite app cannot write back to its own source files on disk. Two options, pick one based on how much dev tooling investment is worthwhile:

| Option | How it works | Tradeoff |
|---|---|---|
| **A. In-memory only** | Edits live in component state for the session; "Export" button downloads the edited text as a `.md` file, which the developer manually replaces in `src/prompts/` | Zero extra tooling. Edits don't survive a page refresh unless exported/re-imported manually. |
| **B. Local write-back server** | A small Vite plugin / Express middleware route (`dev`-only, never built into production bundle) that accepts a POST and writes directly to `systemPrompt.ar.md` on disk | True live-edit-and-persist workflow. Slightly more setup; must be explicitly excluded from the production build. |

**Recommendation:** start with Option A — it's zero-overhead and sufficient for the current iterative-testing workflow (edit → test → manually commit the file when satisfied). Revisit Option B only if the manual export/replace step becomes a real friction point.

### Versioning
Since the prompt will keep changing, keep a lightweight changelog at the top of the prompt file itself (date + one-line summary of what changed and why — e.g., "2026-06-19: added Rule 7 diacritic-ambiguity clause after observing unrequested diacritic stripping"). This keeps the *reasoning history* attached to the artifact, which matters more here than in typical code since prompt changes are empirically driven, not just refactors.

---

## Part B — Production: custom instructions UI

### Two modes, different risk profiles

**1. Additive mode ("Additional Instructions")**
- User-supplied text is appended after the full hardcoded system prompt, in its own clearly delimited block.
- Low risk: cannot remove or contradict structural rules, since it's strictly additive. Worst case is stylistic drift, not structural breakage.
- Suggested framing in the appended block, so the model treats it as supplementary rather than competing instruction:
  ```
  تعليمات إضافية من المستخدم (طبّقها بما يتوافق مع القواعد أعلاه، دون مخالفتها):
  <user's custom text>
  ```

**2. Overriding mode ("Override Instructions") — scoped, not absolute**
- Important refinement: this should not be a true full prompt replacement. Instead, split the system prompt into two layers:
  - **Structural layer (never overridable):** output JSON shape, required fields (`العبارة`/`الخطأ`/`التصحيح`), the anchor-must-be-verbatim-substring rule, the silent-decision rule (Rule 6). These exist to keep the app's parser and consistency-check script functional — breaking them breaks the app, not just the output quality.
  - **Editorial layer (user-overridable):** behavioral/style stances like the diacritics-ambiguity policy, how aggressively to flag borderline cases, whether to include spelling vs. grammar vs. both, tone of the `الخطأ` description.
- In override mode, the user's text replaces the editorial layer's defaults but the structural layer is always appended afterward, non-negotiably, framed as:
  ```
  بصرف النظر عن أي تعليمات أخرى، يجب الالتزام بالتنسيق والقواعد البنيوية التالية دون أي استثناء:
  <structural layer rules>
  ```
  placed last in the prompt, since later instructions tend to carry more weight in practice — this is a deliberate ordering choice to maximize compliance with the non-negotiable layer.

### UI sketch (Configuration tab)
- Toggle: **"Additional" / "Override"** (radio, defaults to Additional — the safer option)
- Textarea: custom instructions input
- Inline note next to the Override option: *"Override replaces editorial preferences only — output format rules are always enforced."* (Sets correct user expectations; prevents support confusion when a user's full override doesn't behave like a full override.)

### Why this split matters for the rest of the architecture
This cleanly slots into the `FeatureConfig` plan-gating idea from Phase 3 — e.g., a free/testing tier could restrict users to Additive-only, while a higher tier unlocks Override mode, as a natural plan-differentiation lever that didn't exist before this addendum.

---

## Updated Plan Items

**Phase 1 (Core migration) — addition:**
- [ ] Externalize system prompt to `src/prompts/systemPrompt.ar.md`, imported via `?raw`
- [ ] Split prompt into structural-layer / editorial-layer sections internally (even before the override UI exists, this separation is good hygiene and costs little now)

**Phase 3 (Modular feature architecture) — addition:**
- [ ] Add `customInstructionsMode: 'additive' | 'override' | 'none'` to `FeatureConfig`
- [ ] Build Configuration tab UI: mode toggle + custom instructions textarea
- [ ] Implement prompt-assembly logic: additive (append after full prompt) vs. override (replace editorial layer, structural layer always appended last)

**Phase 4 (Dev tooling) — addition:**
- [ ] Dev-only prompt-editing panel in the Playground-style tab (Option A: in-memory + export-to-file)
- [ ] Maintain changelog header in the prompt source file

---

## Open Question

Should the **structural layer** be entirely fixed, or should *some* structural elements (e.g., which fields appear, beyond the three core ones) eventually become plan-configurable too — for instance, a future tier that wants an added `الفئة` (category) field per recommendation? Worth deciding now whether "structural" means "permanently fixed" or "fixed per-plan, configurable by you the developer but never by the end user" — the latter is more future-proof and doesn't cost much extra to design for upfront.