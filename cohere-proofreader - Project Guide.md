That's an exceptionally clear brief — the Express-as-future-proxy-seed reasoning is exactly right, and I'll honour it structurally even though the proxy is empty today. Let me build this.

Here's what I'm going to produce as a single code artifact — a full Vite project zip scaffold represented as a structured file tree with complete file contents, covering all four phases:

**Project structure:**
- `vite.config.ts` + `tailwind.config.ts` + `tsconfig.json`
- `src/types/` — `FeatureConfig`, `Recommendation`, `ChunkResult`, API shapes
- `src/prompts/systemPrompt.ar.md` — the 8-rule Arabic system prompt from your attachment
- `src/lib/` — `cohereClient.ts`, `chunker.ts`, `consistencyCheck.ts`, `rateLimiter.ts`, `promptAssembler.ts`
- `src/config/featureConfig.ts` — plan definitions
- `src/components/` — tabs: Config, Input, Output, Playground (dev-gated)
- `server/` — minimal Express dev server with `/api/save-prompt` write-back endpoint
- `.env.example`Here's the full picture of what's in the scaffold and how the pieces fit together:

**Project structure (31 files, 4 phases)**

```
arabic-proofreader/
├── index.html                          # RTL html[dir=rtl] root
├── package.json                        # concurrently runs Vite + Express
├── vite.config.ts                      # proxies /api/* → Express dev server
├── tailwind.config.ts                  # RTL variant support
├── .env.example
│
├── src/
│   ├── main.tsx / index.css / App.tsx  # shell + tab routing
│   ├── types/
│   │   ├── recommendation.ts           # Recommendation, ChunkResult, MergedResult
│   │   ├── featureConfig.ts            # FeatureConfig, PlanTier, ModelId
│   │   └── cohere.ts                   # API request/response shapes
│   ├── config/
│   │   └── featureConfig.ts            # TESTING_DEFAULTS, PRODUCTION_DEFAULTS, STRUCTURAL_PROMPT_LAYER
│   ├── context/
│   │   └── AppContext.tsx              # AppState + reducer + useAppState/Dispatch
│   ├── lib/
│   │   ├── chunker.ts                  # splitIntoChunks + === delimiter wrapping
│   │   ├── promptAssembler.ts          # none/additive/override assembly + multi-turn messages
│   │   ├── cohereClient.ts             # callCohere + testCohereConnection
│   │   ├── consistencyCheck.ts         # checkRecommendations + mergeChunkResults (ported from your JS)
│   │   ├── rateLimiter.ts              # sliding-window token bucket (20 req/min in Testing tier)
│   │   ├── usageCounter.ts             # localStorage monthly call counter
│   │   ├── proofreadingSession.ts      # orchestrator: chunk → rate-limit → call → check → merge
│   │   ├── schemaMode.ts               # Phase 5 stub: Arabic-keyed schema to validate vs real API
│   │   └── temperatureTest.ts          # Phase 5 stub: temperature floor re-verification guide
│   ├── prompts/
│   │   └── systemPrompt.ar.md          # 8-rule prompt, Vite ?raw imported, with changelog header
│   └── components/
│       ├── shared/
│       │   ├── ConnectionPanel.tsx     # PING/PONG test + debug output
│       │   ├── UsageMonitor.tsx        # monthly ceiling bar + reset
│       │   └── ChunkProgressList.tsx   # per-chunk status tracker
│       └── tabs/
│           ├── ConfigTab.tsx           # API key, tier toggle, model, params, custom instructions
│           ├── InputTab.tsx            # text entry, file upload, submit → session
│           ├── OutputTab.tsx           # clean/flagged split, stats bar, JSON export
│           └── PlaygroundTab.tsx       # dev-only: prompt editor + save-to-disk + test runner + inspector
│
└── server/
    └── index.cjs                       # Express: /api/save-prompt write-back + production proxy stub
```

**Key design decisions reflected in the code:**

The `STRUCTURAL_PROMPT_LAYER` in `featureConfig.ts` is the non-overridable JSON contract anchor — it's always the last thing appended by `promptAssembler.ts`, even in Override mode. The `FeatureConfig` type is the single source of truth that `proofreadingSession.ts`, the rate limiter, chunker, and all UI tabs read from. The `PlaygroundTab` only renders when `import.meta.env.DEV` is true — Vite tree-shakes it entirely in `npm run build`. The Express server is `.cjs` so it runs cleanly under `"type": "module"` in `package.json`, and its production proxy stub is commented in place so it's the obvious next insertion point.

The scaffold assumes a few things that `npm create vite` doesn't give you by default. Here's the full picture:

## 1. Base Vite project

```bash
npm create vite@latest arabic-proofreader -- --template react-ts
cd arabic-proofreader
npm install
```

## 2. Tailwind CSS (v4, via the Vite plugin)

```bash
npm install tailwindcss @tailwindcss/vite
```

Tailwind v4 doesn't need a `postcss.config.js` or `tailwind.config.js` content scanning setup the old way — the `@tailwindcss/vite` plugin (already wired into `vite.config.ts` in the scaffold) handles it, and `src/index.css` just needs `@import "tailwindcss";` at the top, which I already included.

## 3. The dev server (Express + write-back)

```bash
npm install -D express cors
```

These are dev dependencies only — they run `server/index.cjs`, never ship in the Vite production bundle.

## 4. Concurrently (runs Vite + Express together with one command)

```bash
npm install -D concurrently
```

This powers the `npm run dev` script (`concurrently "vite" "node server/index.cjs"`).

## One thing to double check

`fs.writeFileSync` in `server/index.cjs` is built into Node, so no extra package needed there — I mentioned `chokidar` in my setup comment earlier but the current scaffold doesn't actually use file watching anywhere, so you can skip it. I'll flag that as a leftover from the original instructions rather than something the code needs.

## All-in-one install command

```bash
npm install tailwindcss @tailwindcss/vite
npm install -D express cors concurrently
```

After that, `cp .env.example .env`, fill in `VITE_COHERE_API_KEY`, and `npm run dev` should bring up Vite on `:5173` and Express on `:3001` together.

One real gap worth flagging: calling `api.cohere.com/v2/chat` directly from the browser may hit a CORS wall depending on Cohere's policy — the scaffold's dev proxy in `vite.config.ts` only proxies `/api/*` to your local Express server, not to Cohere itself. If you get CORS errors on the first connection test, that's the likely cause, and the fix is routing Cohere calls through `/api/cohere` on the Express side instead of calling `api.cohere.com` from `cohereClient.ts` directly — which conveniently is also exactly the production-proxy seed you already planned to build.
