# Task Handoff: Migrating to Cohere `command-a-plus-05-2026`

## Context

I'm migrating the current artifact (Arabic proofreading tool) to a self-hosted version, and I'm considering using Cohere's `command-a-plus-05-2026` as the backing model instead of the current Cloudflare models I was previously testing. This report covers everything discovered specifically about the Cohere integration — model behavior, prompt design, output format, and unresolved issues.

Eventually, and based on insights of this report, I want to take the next  steps twards developping the new version of the app discussed in this report. 
## Background: why I moved away from Gemma

The original implementation called `@cf/google/gemma-4-26b-a4b-it` via Cloudflare Workers AI, using a JSON-only system prompt per phase (the app ran 4 separate phases, one per error-category section of a knowledge base). That model turned out to be a reasoning model: it emitted its entire chain-of-thought into a `reasoning` field and got cut off by `finish_reason: "length"` before ever reaching the actual JSON answer in `content`. The model wasn't refusing to produce JSON — it was running out of token budget mid-thought. This is what prompted testing Cohere's `command-a-plus-05-2026` as an alternative, since it has documented, controllable reasoning/thinking toggles rather than always-on uncontrolled reasoning.

## Model facts confirmed via documentation

- **Model ID:** `command-r7b-arabic-02-2025` 
- **Context window:** 128,000 tokens; **max output:** 4,000 tokens
- Cohere's first MoE model; supports vision+text, 48 languages, agentic tool use
- **Pricing:** free until rate limits are reached, for both trial and production keys
- **API:** Chat API V2 (`co.chat(...)`), roles are `system`, `user`, `assistant`, `tool`
- **System message:** sent as the first element of the `messages` array; the model respects it over instructions from other roles
- **Multi-turn:** natively supported — a single request can carry a full `messages` history (system + alternating user/assistant turns), and the model treats earlier turns as context for later ones
- **Reasoning/thinking:** controllable via a `thinking` parameter — `{"type": "disabled"}` to turn off (enabled by default on reasoning-capable configs), or `{"token_budget": N}` to cap thinking tokens. Per docs, when a thinking budget is exceeded, the model **immediately proceeds to the final answer** rather than truncating mid-thought — this is a materially safer failure mode than what happened with Gemma on Cloudflare.
- **No documented manual prompt-caching mechanism** (no `cache_control`-style API like Anthropic's). This means the practical way to avoid re-sending a large system prompt repeatedly is to rely on native multi-turn (send system once, append user turns) rather than any explicit cache API.
- **Structured Outputs (JSON):** two modes exist — **JSON mode** (`response_format: {"type": "json_object"}`, no schema, guarantees syntactically valid JSON only) and **JSON Schema mode** (adds a `"schema"` field for strict structural enforcement). Schema mode supports nested objects/arrays, required fields, enums, etc., but does **not** support `minLength`/`maxLength`, numeric ranges, or full regex anchors (`^`, `$`, lookaheads).

## Architecture decisions made during testing

**1. Dropped the knowledge-base/category-phase design entirely.** Testing showed the model can correctly identify "only grammatical errors" vs. "all errors" from instruction alone, with no knowledge-base context needed. This is a major token-budget win versus the original Cloudflare design, which sent a large KB JSON blob with every phase call.

**2. Replaced category-based phases with text-chunk-based multi-turn.** The original 4-phase split was by error category (mirroring the KB structure). The actual constraint that motivated phasing was never "the model needs categories" — it was output volume per call. So the redesigned architecture chunks the **input text** instead, and asks for "all error types" in every turn:
- Turn 1: system prompt (sent once) + first chunk + "find all errors in this chunk"
- Turn 2..N: next chunk (user-only turn, appended to the conversation) + same instruction, with an explicit "don't repeat errors from earlier chunks" instruction
- Each chunk is wrapped in `=== المقطع الحالي ===` / `=== نهاية المقطع ===` delimiters to give the model a clear boundary against the accumulating conversation history, since reasoning/large-context models can drift toward re-processing the wrong span once several similar-structured turns accumulate.
- Trade-off accepted: context grows cumulatively per turn (turn N carries turns 1..N-1's full Q&A), but this is also the de facto substitute for prompt caching, since the system prompt and original instructions are sent only once across the whole multi-turn session rather than resent every phase.

## Parameter findings (empirical, from Playground testing)

| Parameter | Working value | Notes |
|---|---|---|
| `response_format` | JSON mode, **no schema** | See below — schema mode failed |
| `temperature` | `0.4` | `0.0` and `0.1` both **failed** to produce usable output in testing — this was unexpected and not yet root-caused. Worth re-verifying since a hard floor at `0.4` is unusual for an extraction task and may have been specific to the particular test runs rather than a real model constraint. |
| `thinking` | disabled | Confirmed working; avoids the Gemma-style truncation failure mode entirely for this task |
| `seed` | `42` | Used for reproducibility across prompt-variant A/B testing |

### JSON Schema mode: failed, then partially explained

Initial attempt used an English-keyed schema (`anchor`/`comment` fields) — this **failed**, producing degraded/unusable output despite valid-looking constraints. Hypothesis: forcing the model through two simultaneous transformations (free-form Arabic analysis → structural decoding **and** Arabic-concept → English-label mapping) under schema-constrained token-level decoding caused quality collapse. This is a hypothesis, not confirmed — it was not re-tested with reasoning enabled or other schema simplifications beyond what's listed below.

A revised attempt used the model's **own Arabic output labels** as JSON keys (`التوصيات`, `العبارة`, `الخطأ`, `التصحيح`) instead of English ones — **not yet fully validated**, but a structurally simpler version of this schema was rejected by the Playground UI when it included `"type": "json_object"` at the top level and `"type": "object"`/`"type": "array"` on container nodes. A minimal version omitting those (keeping only leaf-level `"type": "string"`) **was accepted by the UI**:
```json
{
    "properties": {
      "التوصيات": {
        "items": {
          "properties": {
            "العبارة": { "type": "string" },
            "الخطأ": { "type": "string" },
            "التصحيح": { "type": "string" }
          },
          "required": ["العبارة", "الخطأ", "التصحيح"]
        }
      }
    },
    "required": ["التوصيات"]
}
```
**Open question carried forward:** whether this UI-accepted shape is a Playground-specific simplification or whether the actual API's `response_format` body requires the fuller wrapper even when the Playground field doesn't enforce it. This needs verification against the real API before relying on it in production — the Playground UI and raw API request validation are not guaranteed to be identical.

### JSON mode without a schema: the actual winning configuration

The most significant finding: enabling JSON mode with **no schema at all** (just `{"type": "json_object"}`) made the model spontaneously produce well-structured JSON using its own natural Arabic field labels, e.g.:
```json
{ "التوصيات": [
    { "العبارة": "قررتُ أنا أَسافِر", "الخطأ": "تكرار \"أنا\"...", "التصحيح": "قررتُ السفر" }
] }
```
This is the current best path: valid, parseable JSON with no schema-induced quality degradation, since (hypothesis) bare JSON mode likely only enforces syntactic validity rather than constraining the decoder through a rigid schema graph. This was confirmed to also work correctly across a 3-turn multi-turn chunked test (chunk-independence held — no duplicate errors repeated across turns).

## System prompt: iterative defect-driven design

The system prompt went through several rounds based on real output defects observed in testing. Current state (full text available as a separate artifact, `Cohere_SystemPrompt_v2_with_examples.md`) contains 8 numbered rules, each with a **minimal-pair example structure**: a ✅ correct example and one or more ❌ incorrect examples that share the **same `العبارة`/`الخطأ` input**, varying only the field that violates the rule. This was a deliberate refinement — same-case (minimal pair) examples isolate the variable being taught more clearly than examples that vary multiple things at once, since the model's attention is forced onto exactly the field where the rule applies rather than having to infer what changed between two unrelated sentences. Where a rule has more than one distinct failure mode (e.g., Rule 1), multiple ❌ variants are used, with at least one kept on the same case and one on a different case explicitly labeled to distinguish "same trigger, different magnitude" from "different trigger, same underlying rule."

### Defects found and addressed, in order of discovery:

1. **Visible hedging/deliberation in output** — early test showed the model writing visible self-doubt directly into a field (e.g., "ربما... دعنا نتحقق... في الواقع... نتجاهل هذا") instead of committing to a single decision. **Fix:** Rule 6 ("القرار الصامت") explicitly bans hedging language and instructs silent internal decision-making before writing.

2. **Anchor/correction scope mismatch** — corrections sometimes extracted just the corrected word rather than the full contextual phrase matching the anchor's span, breaking find/replace usability (e.g., anchor was a full sentence, correction was a single word). **Fix:** Rule 1, with two ❌ variants — one showing a correction that's merely de-contextualized (risky but might coincidentally match elsewhere), and one showing a correction that literally doesn't exist as a substring anywhere in the source text (worse — guaranteed find/replace failure).

3. **No-op entries (anchor === correction)** — model described an error in the `الخطأ` field but the `التصحيح` field was byte-identical to `العبارة`, meaning the described fix was never actually applied. **Fix:** Rule 2 (correction must implement what error description claims) and Rule 3 (if truly no error exists, delete the entry entirely rather than including a "no error" placeholder entry).

4. **Partial-scope correction** — when two distinct errors existed within the same anchor span (e.g., `"هاذا الجامعت"` — both a demonstrative-pronoun error and a spelling error), the model would sometimes fix only one and leave the entry's `التصحيح` still containing the other unfixed error, apparently trusting that the second error would get "its own" entry elsewhere — which didn't always happen. **Fix:** Rule 4 explicitly requires reviewing the full anchor span after drafting a correction and fixing everything found within that span in the same entry, not deferring to a separate entry.

5. **Unstated side-effect edits** — corrections sometimes altered things not mentioned in the error description (dropped commas, changed unrelated words for "style") beyond what Rule 4's legitimate full-span cleanup would justify. **Fix:** Rule 5 restricts changes to only what's explicitly described in `الخطأ`, except where Rule 4's full-span cleanup applies.

6. **Diacritics handling** — needed explicit instruction that existing diacritics in the source must be preserved verbatim in the anchor, and that corrections should only add/fix diacritics at the actual error point without stripping or adding diacritics elsewhere in the phrase. **Fix:** Rule 7, with a ❌ example showing wholesale diacritic-stripping across an entire sentence when only one word's diacritic was actually wrong.

### Known limitation not fully resolved

Even after the Rule 4 fix (full-span cleanup), partial-fix defects in dense multi-error spans may not be fully eliminated by prompting alone — this is a genuinely harder case (overlapping errors in one span) than single-error spans. A mechanical, non-AI fallback was designed as a safety net:

## Consistency-check post-processing logic (app-side, not AI-dependent)

A JavaScript module (`recommendationConsistencyCheck.js`) was drafted to run after each chunk's JSON response, before merging into final output:
- **Pass 1:** drops entries where `العبارة === التصحيح` (no-op, confirmed low-risk/cosmetic issue, safe to silently filter)
- **Pass 2:** flags (does not auto-discard) entries whose `التصحيح` still contains another entry's `العبارة` text verbatim as a substring (length ≥ 4 guard to avoid false positives on short particles) — this is the mechanical detector for the "partial-scope correction" failure pattern, catching cases the prompt-level Rule 4 fix might still miss
- Includes a `mergeChunkResults()` helper for cross-chunk global anchor deduplication, mirroring the original app's existing dedupe logic
- Flagged entries are intended to be surfaced for review (e.g., a collapsed "N items need review" UI element) rather than silently dropped, since a flagged entry usually indicates a real uncorrected error still sitting in the text, just attached to the wrong anchor

## Open questions / suggestions for next steps

Towards creating a solid development plan of the new version, we need to consider the following:  

1. **Re-verify the temperature floor.** The `0.4` minimum-working-temperature finding is unusual and was only observed across a small number of test runs — worth confirming it's a real model behavior and not an artifact of those specific test prompts, especially before locking it into production defaults.

2. **Validate the Arabic-keyed JSON Schema mode against the real API**, not just the Playground UI, since the UI's schema-field validation may not match what the actual `response_format` request body requires. If it works cleanly against the real API, it would remove the lingering risk of relying on schema-less JSON mode's "spontaneous" structure, which is theoretically less guaranteed than explicit schema enforcement even though it tested well so far.

3. **The boosted 8-rule system prompt with full minimal-pair examples has not yet been tested in the multi-turn chunked configuration.** All defect-driven fixes were validated individually or in earlier prompt versions; a full re-test combining the final 8-rule prompt + chunked multi-turn + JSON-mode-no-schema is the logical next Playground pass before considering this production-ready.

4. **Consider whether the consistency-check script should run per-chunk or only at final merge time** — running it per-chunk means flagged entries could theoretically be re-requested from the model within the same multi-turn session (e.g., a follow-up turn saying "entry X still has an issue, please fix"), which isn't currently designed but could be a way to close the dense-multi-error-span gap without giving up and relying purely on mechanical post-processing.

5. **Token/cost modeling not yet done.** The chunked multi-turn design's cumulative context growth (each turn re-sends all prior turns) needs a real token-cost projection for realistically-sized documents, to confirm it's actually cheaper than the original 4-fixed-phase Cloudflare design rather than just architecturally cleaner.