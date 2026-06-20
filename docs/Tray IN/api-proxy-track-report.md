# Follow-Up Report: API Proxy Track

Date: 2026-06-20
Status: Complete, with two open items flagged below (not blockers)

## Summary of changes

Moved all Cohere API calls from direct browser → `api.cohere.com` to a local proxy path: browser → `/api/cohere` (Express) → `api.cohere.com`. This removes the CORS risk on the client and gives the server a place to hold a real API key going forward.

## Files touched

| File | Change |
|---|---|
| `server/index.cjs` | Added `POST /api/cohere` proxy route. Added `cohere-proofreader.test` to CORS allow-list. `/api/save-prompt` untouched. |
| `src/lib/cohereClient.ts` | Removed the `COHERE_CHAT_V2` constant and all direct `fetch("https://api.cohere.com/...")` calls. Added `resolveApiBase()` reading `VITE_API_BASE_URL`. `callCohere()` and `testCohereConnection()` now both call the proxy. |
| `src/types/cohere.ts` | Added `ProxyRequestBody` (extends `CohereChatRequest` with optional `apiKey`) and `ProxyErrorPayload`. |
| `src/components/shared/ConnectionPanel.tsx` | Stage labels now reflect the proxy-aware four-way failure split; added a one-line stage hint above the debug pane. |
| `.env.example` | Added `VITE_API_BASE_URL` and `COHERE_API_KEY`, documented which mode uses which. |
| `vite.config.ts` | **No change.** Your existing mode-aware config already does everything Task 3 needed on the dev-proxy side. Reproduced in the artifact for reference only. |

Not touched, per your non-goals list: `AppContext.tsx`, `ConfigTab.tsx`, the parsing logic inside `extractText`/`safeParseChunkResponse`, plan-tier/usage-counter logic, schema-mode work, chunking logic.

## Final request contract for `/api/cohere`

**Request** (POST, JSON body) — identical to the Cohere chat payload, plus one extra optional field:

```json
{
  "model": "command-r7b-arabic-02-2025",
  "messages": [ { "role": "system", "content": "..." }, ... ],
  "response_format": { "type": "json_object" },
  "temperature": 0.4,
  "seed": 42,
  "max_tokens": 4000,
  "thinking": { "type": "disabled" },
  "apiKey": "co-...your-key (dev fallback only)"
}
```

`apiKey` is stripped by the proxy before forwarding upstream and is **only used if `COHERE_API_KEY` is not set in the server's environment**. If the server env key is present, the client field is ignored entirely — meaning once you set `COHERE_API_KEY` server-side, the client can stop sending a key at all and `VITE_COHERE_API_KEY` becomes dead weight.

**Response** — on success, the Cohere JSON payload is returned unmodified, with the original Cohere status code (this should virtually always be 200 on success). On failure:

| Status | Meaning | Body |
|---|---|---|
| `400` | Proxy has no key available (neither server env nor client fallback) | `{ "error": "..." }` |
| `429` | Cohere rate-limited the request | Cohere's original body; `retry-after` header forwarded |
| `401` / `403` | Cohere rejected the key | Cohere's original body, status passed through |
| `502` | Proxy couldn't reach `api.cohere.com` at all (network failure) | `{ "error": "...", "detail": "..." }` |
| other non-2xx | Cohere returned something else | Cohere's original body, status passed through |

## Env variables added or changed

```bash
# Client (Vite)
VITE_API_BASE_URL=        # empty = relative /api (Vite dev); set for Laragon mode
VITE_COHERE_API_KEY=      # now only a dev fallback, sent as body field, not a header

# Server (Express)
COHERE_API_KEY=           # preferred; real key, never sent to browser
DEV_SERVER_PORT=3001
```

## How Vite dev mode is run and tested

1. `cp .env.example .env`, leave `VITE_API_BASE_URL` empty.
2. Either set `COHERE_API_KEY` in a `server/.env` (preferred) **or** leave it unset and rely on `VITE_COHERE_API_KEY` as the dev fallback.
3. `npm run dev` (starts Vite on `:5173` + Express on `:3001` via `concurrently`).
4. Open `http://localhost:5173`, go to Config tab → Test Connection.
5. Vite's existing `server.proxy["/api"]` rule forwards `/api/cohere` to `http://localhost:3001/api/cohere` transparently — confirmed by code inspection of `vite.config.ts`, which I did not need to change.

## How Laragon mode is run and tested

1. Build the static app: `npm run build -- --mode laragon` (uses your existing `isLaragonBuild` branch, `base: "/dist/"`).
2. Serve `dist/` from Apache/Laragon at `http://cohere-proofreader.test/` via your `index.php`/`.htaccess` (not authored in this pass — see Known Limitations).
3. Set `VITE_API_BASE_URL=http://localhost:3001` **at build time** (it's a Vite env var, baked into the bundle at build, not reconfigurable at runtime without a rebuild).
4. Run the Express server separately: `node server/index.cjs` (or keep it running from a parallel `npm run dev` session).
5. The Laragon-served frontend now calls `http://localhost:3001/api/cohere` directly rather than a relative path, bypassing Apache entirely for API calls — Apache only ever serves the static bundle.
6. CORS on the Express side already allows `http://cohere-proofreader.test` as an origin.

## What worked

- The four-way connection-test failure split (Local Proxy / Upstream Auth / Rate Limit / Response Shape) cleanly separates "your dev server is down" from "your Cohere key is bad," which was the main ambiguity in the original direct-call version.
- `retry-after` forwarding preserves the existing client-side `isRateLimit`/`retryAfterSecs` handling in `proofreadingSession.ts` and `RateLimiter` with zero changes needed there.
- The `apiKey` body-field fallback means the dev workflow doesn't break for anyone who hasn't set `COHERE_API_KEY` server-side yet — no forced migration step.

## What remains unresolved

- **`index.php` and `.htaccess` were listed as "to be created" but not provided.** I did not author them, since guessing at your Apache rewrite rules or PHP serving logic risks shipping something that silently conflicts with whatever you already have on disk in your Laragon environment. If you share those files (even empty/stub versions), I can verify the static-serving path actually works end-to-end with the `base: "/dist/"` setting.
- **`COHERE_API_KEY` server-side persistence isn't addressed.** Right now you'd set it as a shell env var or in a `server/.env` that `server/index.cjs` doesn't currently load via `dotenv` — the file reads `process.env.COHERE_API_KEY` directly. If you want `server/.env` to actually be picked up, you'll need `require('dotenv').config()` at the top of `server/index.cjs`, which I held off adding since it's a new dependency not explicitly requested in this pass.

## Compromises / temporary decisions

- `VITE_API_BASE_URL` is consumed only in `cohereClient.ts`, not threaded through any other client module — there was no other module making network calls, so this was sufficient, but if a future module needs the API base too, it should import `resolveApiBase()` rather than re-reading the env var itself.
- The proxy forwards Cohere's body **unchanged** on all paths rather than reshaping errors into a single uniform schema. This was a deliberate choice to keep `extractText`/`safeParseChunkResponse` working without modification, per your instruction to preserve existing parsing — a uniform error envelope would have required touching that logic.

## Known Limitations

- No `dotenv` loading in `server/index.cjs` yet (see above) — `COHERE_API_KEY` currently needs to be exported in the shell or otherwise injected into the Node process.
- Laragon's actual static-serving correctness (the `index.php`/`.htaccess` piece) is unverified since those files weren't available to test against.
- The pre-existing `extractText()` ambiguity (empty string on both "no text block" and "genuinely empty model response") is still present — flagged, not fixed, per scope.
- No automated tests were added for the proxy route; verification below is manual/structural only, since I don't have a live Cohere key or your Laragon environment to execute against.

## Manual Test Results

I was not able to execute these against a live server/key in this environment, so this section reflects **structural verification only** — code paths traced by hand, not live HTTP traffic:

| Scenario | Expected | Verified by |
|---|---|---|
| Vite dev, no `COHERE_API_KEY` set, `VITE_COHERE_API_KEY` set | `apiKey` field included in proxy body, used as fallback | Code trace: `buildProxyBody` always includes `apiKey`; server only ignores it when `process.env.COHERE_API_KEY` is truthy |
| Vite dev, `COHERE_API_KEY` set server-side | Client-sent `apiKey` ignored | Code trace: `effectiveKey = serverKey || clientSuppliedKey` |
| Proxy unreachable (Express not running) | `ConnectionPanel` shows "Local Proxy" stage | Code trace: `fetch` throws → caught in `testCohereConnection`'s outer try/catch → `stage: "Local Proxy"` |
| Cohere returns 401 | `ConnectionPanel` shows "Upstream Auth" stage, not "Local Proxy" | Code trace: proxy passes 401 straight through; client checks `resp.status === 401` after the network-level catch, correctly attributing it upstream |
| Cohere returns 429 | `retry-after` header preserved end-to-end | Code trace: Express does `res.set("retry-after", ...)` before `res.status(...).json(...)`; client's existing `resp.headers.get("retry-after")` logic in `callCohere` is unchanged and reads it normally |

**Recommendation:** before merging, run a live smoke test of at least the 401 and network-unreachable cases manually, since header-forwarding behavior across `res.set()` + `res.status().json()` in Express is the one piece I'd want eyes-on rather than trace-only confidence.

## Recommended next task

Given the two unresolved items above, I'd suggest **either**:
1. A short follow-up to add `dotenv` loading to `server/index.cjs` (small, low-risk, unblocks real server-side key usage), **or**
2. Sharing the `index.php`/`.htaccess` files so the Laragon serving path can actually be verified rather than assumed correct.

Both are small enough to fold into the same next pass if you'd rather not split them into separate tracks.
