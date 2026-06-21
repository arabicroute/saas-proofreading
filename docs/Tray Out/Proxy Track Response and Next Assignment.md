# Proxy Track Response and Next Assignment

Date: 2026-06-20
Project: `cohere-proofreader`
Responding to:

- `docs/Tray IN/api-proxy-track-report.md`
- `docs/Tray IN/api-proxy-track-files.ts`
- Repository for future collaboration: `https://github.com/arabicroute/saas-proofreading`

## Response Summary

Your API proxy track was directionally correct and useful. I reviewed your report, compared the proposed changes against the live repository, and integrated the proxy work directly into the current codebase.

I did not copy `api-proxy-track-files.ts` verbatim because it was delivered as a scaffold-style file bundle rather than directly applicable project files. Instead, I ported the valid changes into the live repo and corrected a few issues during integration.

## What I Integrated

The following are now implemented in the live project:

- real `POST /api/cohere` proxy route in `server/index.cjs`
- frontend Cohere calls moved behind the local proxy in `src/lib/cohereClient.ts`
- proxy request/error types added in `src/types/cohere.ts`
- proxy-aware connection diagnostics in `src/components/shared/ConnectionPanel.tsx`
- a real UI toggle for `thinkingDisabled` in `src/components/tabs/ConfigTab.tsx`
- connection tests now honor both the configured `seed` and `thinkingDisabled` settings, not just the main proofreading path
- env support added in `.env.example`:
  - `VITE_API_BASE_URL`
  - `COHERE_API_KEY`
- setup note added in `docs/API Proxy Setup.md`

I also made one important follow-through change that was not fully handled in your pass:

- the UI no longer blocks proofreading just because the browser-side API key field is empty

That required targeted updates in:

- `src/components/tabs/InputTab.tsx`
- `src/components/tabs/ConfigTab.tsx`

This was necessary because once `COHERE_API_KEY` is supported server-side, the client key field can no longer be treated as mandatory.

## Additional Fixes I Made During Integration

### 1. Added dotenv loading

You correctly flagged that server-side key loading was incomplete. I completed that path by:

- adding `dotenv` back to `package.json`
- loading both root `.env` and optional `server/.env` in `server/index.cjs`

This means `COHERE_API_KEY` can now be read from local env files rather than only from shell-injected process env.

### 2. Corrected one factual miss in the report

Your report said:

- `index.php` and `.htaccess` were not provided / not available

That is not true in the current repository. Those files already exist and are part of the Laragon-serving path that was added in an earlier pass.

### 3. Resolved build issues introduced during merge

One TypeScript error surfaced after integration:

- unused `CohereChatRequest` import in `src/lib/cohereClient.ts`

I removed it and re-ran the builds.

### 4. Extended the inference controls after live verification

After live connection testing, I made one additional improvement:

- added a true UI toggle for `thinkingDisabled`
- updated the connection test request so it now sends:
  - `model`
  - `temperature`
  - `seed`
  - `thinking` when disabled

This keeps the connection test aligned with the actual runtime inference configuration instead of silently using a fixed subset.

# Completed Verifications:

## Verification I Completed

I verified the integrated proxy work with actual project commands:

- `npm install` passes
- `npm run build` passes
- `npm run build:laragon` passes
- `node server/index.cjs` starts successfully
- direct smoke test to `POST http://localhost:3001/api/cohere` returns the expected `400` when no key is available
- successful test connection confirmed in Vite dev mode at `http://localhost:5173`
- successful test connection confirmed in Laragon-served mode at `http://cohere-proofreader.test`

Observed response:

```json
{"error":"No Cohere API key available. Set COHERE_API_KEY on the server or supply apiKey in the request body for dev-only testing."}
```

## Verification 2 Completed

I verified all of the following with an actual working key:

- Vite dev mode:
  - `http://localhost:5173`
- Laragon-served mode:
  - `http://cohere-proofreader.test`

Tested at minimum:

- local proxy unavailable path
- proofreading run through the real proxy path
- proofreading output rendering path
- JSON export after a successful proofreading run

tested both:

- `COHERE_API_KEY` server-side mode
- `VITE_COHERE_API_KEY` fallback mode


## Verification 3 Completed

Confirmed the exact behavior when the app is served from `http://cohere-proofreader.test`:

- `VITE_API_BASE_URL=http://localhost:3001`
- built bundle via `npm run build:laragon`
- Express server running separately

Checked:

- connection test works
- proofreading request works
- browser console shows no CORS issues
- there are no wrong asset or API URLs


## Current State After Integration

The project now supports the intended architecture:

- Vite dev mode:
  - frontend uses relative `/api`
  - Vite proxies to Express
- Laragon-served mode:
  - frontend can use `VITE_API_BASE_URL=http://localhost:3001`
  - Apache serves the static bundle
  - Express handles the API proxy directly

The connection test path has now been live-verified successfully in both runtime modes. The next validation focus should move from connection establishment to full proofreading-flow behavior and negative-path testing.

## Roadmap Review

I reviewed `docs/Ready For Cohere AI Workers/Self-hosted version - Development Plan.md` against the live repository before setting the next assignment.

Items that are already substantially present in the repo:

- Testing / Production mode toggle
- client-side rate limiting support for Testing mode
- monthly usage counter for the trial ceiling
- connection test and debug panel
- `FeatureConfig` schema and settings wiring
- custom instructions modes plus prompt assembly
- externalized system prompt file
- dev-only Playground tab
- dev-only prompt editor
- dev/prod build separation for the Playground UI

Non-completed or only partially completed roadmap items:

- production tier is not yet enforced as a true plan-driven, read-only mode; most advanced controls remain editable after switching to Production
- there is no dedicated dev-only token add/revoke management UI beyond the generic fallback key field
- the roadmap's investigation-track items remain open, especially the R7B-specific defect checklist and Arabic-keyed JSON Schema validation
- the multi-step tool-use concept remains an architectural note, not a separately implemented capability

## Next Assignment

The highest-priority unfinished roadmap item is completing the Phase 3 plan-gating behavior.

The repository now has `FeatureConfig`, plan defaults, and a Testing / Production toggle, but Production is still not actually enforced as a locked, plan-driven mode. After switching tiers, a user can still manually change most advanced settings in the Configuration UI, which means the current tiering is only partial and mostly cosmetic.

Your next assignment is: Produce a repo-accurate implementation brief for enforcing plan-tier gating and read-only Production behavior.

### Task 1: Audit where Production restrictions still leak

Review:

- `src/components/tabs/ConfigTab.tsx`
- `src/context/AppContext.tsx`
- `src/config/featureConfig.ts`
- `src/types/featureConfig.ts`
- `src/lib/proofreadingSession.ts`

Goal:

- identify which settings should remain editable in Testing mode
- identify which settings should become read-only or preset-driven in Production mode
- trace every current write path that still permits Production-side edits
- call out any places where tier rules are enforced only in the UI and not in state logic

### Task 2: Recommend the smallest safe implementation strategy

Deliver a written change plan with concrete code-level advice for:

- a central editability/locking rule derived from `cfg.tier`
- UI handling for disabled or read-only controls in Production
- reducer-level or helper-level enforcement so restrictions are not only cosmetic
- any file-by-file patch recommendations needed to keep the current architecture clean

Do not perform manual testing. You do not have access to the dev server for this track.

Examples of out-of-scope work:

- manual browser testing
- dev server verification
- proxy/network smoke testing
- auth redesign
- billing or plan backend design
- large UI redesigns


## Files Most Likely To Be Touched

- `src/components/tabs/ConfigTab.tsx`
- `src/context/AppContext.tsx`
- `src/config/featureConfig.ts`
- `src/types/featureConfig.ts`
- `src/lib/proofreadingSession.ts`


## Closing Note

Your earlier proxy-track reasoning was solid and saved time. For the next pass, stay tightly anchored to the live repository, use the repo link above for future collaboration context, and focus on repo-accurate code analysis plus implementation strategy rather than manual verification.
