# Handoff Report: API Proxy Track

Date: 2026-06-20
Project: `cohere-proofreader`
Primary reference brief: `Key design decisions reflected in the code` section in our last chat conversation thread.

## Purpose

This handoff assigns the next parallel workstream for the app's roadmap, with a focus on the API proxy path that the guide explicitly flags as the most likely immediate gap.

This workstream should move the app away from direct browser calls to `https://api.cohere.com/v2/chat` and toward a local backend proxy flow that is compatible with both:

- Vite dev mode
- the Laragon-served local host at `http://cohere-proofreader.test/`

## Current State Confirmed

The scaffold has been populated and aligned against the guide.

Confirmed project structure and behavior:

- Vite + React + TypeScript scaffold is present
- Express dev helper exists at `server/index.cjs`
- prompt write-back route exists at `/api/save-prompt`
- frontend still calls Cohere directly from the browser in `src/lib/cohereClient.ts`
- the guide explicitly flags this direct-browser pattern as a likely CORS risk
- the app can be served locally from `http://cohere-proofreader.test/` after Laragon restart

Relevant current files: (shared with you)

- `src/lib/cohereClient.ts`
- `server/index.cjs` 
- `src/components/shared/ConnectionPanel.tsx`
- `vite.config.ts`
- `.env.example` (to be created)
- `index.php` (to be created)
- `.htaccess` (to be created)

## Why This Track Matters

The guide says the most important unresolved issue is this:

> calling `api.cohere.com/v2/chat` directly from the browser may hit a CORS wall depending on Cohere's policy ... the fix is routing Cohere calls through `/api/cohere` on the Express side instead of calling `api.cohere.com` from `cohereClient.ts` directly

That makes this the best next parallel task because it:

- addresses the clearest known runtime risk
- advances the future production architecture already anticipated by the scaffold
- reduces later rework around key handling and backend enforcement

## Important Architecture Constraint

Please account for both runtime modes below.

### 1. Vite dev mode

Current behavior:

- frontend runs on `http://localhost:5173`
- Vite proxies `/api/*` to `http://localhost:3001`

This mode can use relative `/api/...` calls.

### 2. Laragon-served mode

Current behavior:

- frontend is served by Apache/PHP at `http://cohere-proofreader.test/`
- the static app is served from the built `dist/` output via `index.php`
- Apache does not currently proxy `/api/*` to the Express server

This means a relative `/api/cohere` call from the Laragon-served app will not automatically hit Express.

Because of that, your implementation should support a configurable API base URL for the frontend.

Recommended approach:

- support `VITE_API_BASE_URL`
- if empty, client uses relative `/api`
- if set, client uses `${VITE_API_BASE_URL}/api`
- for Laragon local testing, this can point to `http://localhost:3001`

You will also need to update Express CORS to allow requests from:

- `http://localhost:5173`
- `http://cohere-proofreader.test`

## Assigned Tasks

## Task 1: Add `/api/cohere` to the Express server

Target file:

- `server/index.cjs`

Implement a real proxy endpoint:

- `POST /api/cohere`
- forwards requests to `https://api.cohere.com/v2/chat`
- preserves Cohere status codes where possible
- forwards `retry-after` on `429`
- returns Cohere JSON payload unchanged when successful

Recommended request contract:

- request body contains the Cohere chat request payload
- allow a dev-only `apiKey` field in the request body as a fallback if server env is not configured
- prefer `process.env.COHERE_API_KEY` when available

Guardrails:

- do not log API keys
- do not change `/api/save-prompt`
- keep the route readable and minimal

## Task 2: Move frontend Cohere calls behind the proxy

Target files:

- `src/lib/cohereClient.ts`
- optionally `src/types/cohere.ts`

Change both:

- `callCohere()`
- `testCohereConnection()`

New behavior:

- frontend should no longer `fetch("https://api.cohere.com/v2/chat")`
- frontend should call the local proxy endpoint instead

Recommended frontend contract:

- keep the existing request assembly logic in the client
- send the assembled body to `/api/cohere`
- in dev fallback mode, include `apiKey` in the proxy request body only when no server-side key is configured yet

Please preserve the current parsing and response-shape handling unless a clear bug is found.

## Task 3: Add environment support for dual runtime modes

Target files:

- `.env.example`
- `vite.config.ts`
- `src/lib/cohereClient.ts`

Add and document:

- `VITE_API_BASE_URL=`
- optional `COHERE_API_KEY=` for the server-side proxy path

Expected behavior:

- Vite dev mode works with relative `/api` through the Vite proxy
- Laragon-served mode works by setting `VITE_API_BASE_URL=http://localhost:3001`

Do not remove the existing UI API key flow unless you also provide a safe transitional path. The goal here is to enable the proxy path first, not to redesign the full auth model.

## Task 4: Update connection testing to validate the actual app path

Target files:

- `src/lib/cohereClient.ts`
- `src/components/shared/ConnectionPanel.tsx`

The connection test should validate the same route the app will really use.

That means:

- the button should test via the proxy path
- failures should distinguish between:
  - local proxy unreachable
  - upstream Cohere auth failure
  - rate limit
  - malformed upstream response

Keep the UX lightweight. Better debug messaging is more important than visual redesign.

## Task 5: Add a short implementation note for the team

Target output:

- either a small `README` section
- or a short markdown note in `docs/`

Document:

- how to run the proxy in Vite dev mode
- how to run it with Laragon local hosting
- which env vars are required for each mode
- what remains intentionally out of scope

## Acceptance Criteria

This track is complete when all of the following are true:

- no frontend code calls `api.cohere.com` directly anymore
- `callCohere()` works through `/api/cohere`
- `testCohereConnection()` works through `/api/cohere`
- Vite dev mode still works
- Laragon-served mode has a clear, documented path to reach the proxy
- server CORS allows the required local origins
- the app still builds successfully
- no existing prompt-editing route is broken

## Suggested File Touch List

Expected:

- `server/index.cjs`
- `src/lib/cohereClient.ts`
- `src/types/cohere.ts`
- `.env.example`
- `vite.config.ts`
- `src/components/shared/ConnectionPanel.tsx`
- one small docs file or README update

Possible but avoid unless truly needed:

- `src/context/AppContext.tsx`
- `src/components/tabs/ConfigTab.tsx`

## Non-Goals For This Pass

Please do not expand scope into these unless absolutely necessary:

- full production auth redesign
- removing the API key UI entirely
- plan-tier enforcement on the backend
- monthly usage authority on the backend
- schema-mode validation work
- prompt or chunking refactors
- broad UI redesign

## Risks To Watch

- Laragon mode is not the same networking setup as Vite dev mode
- relative `/api` calls will not automatically reach Express when served by Apache
- changing the client request contract can accidentally break the current parsing logic
- a proxy that swallows upstream status codes will make debugging harder

## Recommended Implementation Strategy

Suggested order:

1. Implement `POST /api/cohere` in Express
2. Add client-side API base URL support
3. Switch `callCohere()` to the proxy
4. Switch `testCohereConnection()` to the proxy
5. Update CORS and env documentation
6. Verify both Vite and Laragon local flows

## What To Cover In Your Follow-Up Report

Please return a markdown handoff report after you complete this task. Your report should include:

- summary of what you changed
- exact files touched
- final request contract for `/api/cohere`
- env variables added or changed
- how Vite dev mode is now run and tested
- how Laragon mode is now run and tested
- what worked
- what remains unresolved
- whether any compromises or temporary decisions were made
- any recommended next task after this proxy track

Please also include:

- a short "Known Limitations" section
- a short "Manual Test Results" section
- any screenshots or copied response examples if they help explain behavior

## Quick Notes For The Clude AI Agent

- The scaffold and guide are already aligned; do not re-litigate the project structure.
- Treat this as a focused roadmap task, not a rewrite.
- Prefer small, readable changes over ambitious abstraction.
- If you discover a blocker that requires a design decision, document it clearly in your report instead of guessing silently.
