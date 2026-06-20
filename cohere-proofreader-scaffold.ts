// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  COHERE ARABIC PROOFREADER — VITE/REACT/TYPESCRIPT SCAFFOLD                ║
// ║                                                                              ║
// ║  READ THIS FIRST                                                             ║
// ║  ─────────────                                                               ║
// ║  This file is a single-file scaffold index. Each section is a complete      ║
// ║  source file. Copy each block into the path shown in its header comment.    ║
// ║                                                                              ║
// ║  SETUP                                                                       ║
// ║  ─────                                                                       ║
// ║  npm create vite@latest arabic-proofreader -- --template react-ts           ║
// ║  cd arabic-proofreader                                                       ║
// ║  npm install                                                                 ║
// ║  npm install tailwindcss @tailwindcss/vite                                  ║
// ║  npm install -D express cors chokidar                                        ║
// ║  cp .env.example .env          # then fill in your key                      ║
// ║  npm run dev          # starts Vite + Express dev server concurrently        ║
// ║  npm run build        # production build (Playground tab stripped)           ║
// ╚══════════════════════════════════════════════════════════════════════════════╝


// ─────────────────────────────────────────────────────────────────────────────
// FILE: package.json
// ─────────────────────────────────────────────────────────────────────────────
/*
{
  "name": "arabic-proofreader",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"vite\" \"node server/index.cjs\"",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "concurrently": "^9.0.0",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "tailwindcss": "^4.0.0",
    "typescript": "~5.7.2",
    "vite": "^6.2.0"
  }
}
*/


// ─────────────────────────────────────────────────────────────────────────────
// FILE: .env.example
// ─────────────────────────────────────────────────────────────────────────────
/*
# Cohere API key — used directly from the browser in dev/testing mode.
# In production, move this to server/.env and never expose it to the client.
VITE_COHERE_API_KEY=your_cohere_api_key_here

# Dev write-back server port (Express, dev only)
DEV_SERVER_PORT=3001
*/


// ─────────────────────────────────────────────────────────────────────────────
// FILE: vite.config.ts
// ─────────────────────────────────────────────────────────────────────────────
/*
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Proxy /api/* to the local Express dev server during development.
  // In production this block is irrelevant since the Express server
  // becomes the real backend proxy holding the Cohere key server-side.
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
*/


// ─────────────────────────────────────────────────────────────────────────────
// FILE: tailwind.config.ts
// ─────────────────────────────────────────────────────────────────────────────
/*
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**\/*.{ts,tsx}"],
  // Enable RTL variant support (rtl: prefix on utility classes)
  future: { hoverOnlyWhenSupported: true },
} satisfies Config;
*/


// ─────────────────────────────────────────────────────────────────────────────
// FILE: tsconfig.json
// ─────────────────────────────────────────────────────────────────────────────
/*
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
*/


// ─────────────────────────────────────────────────────────────────────────────
// FILE: index.html
// ─────────────────────────────────────────────────────────────────────────────
/*
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>مدقق النصوص العربية</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
*/


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/main.tsx
// ─────────────────────────────────────────────────────────────────────────────
/*
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
*/


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/index.css
// ─────────────────────────────────────────────────────────────────────────────
/*
@import "tailwindcss";

@layer base {
  html {
    font-family: "Segoe UI", Tahoma, Arial, sans-serif;
  }

  [dir="rtl"] textarea,
  [dir="rtl"] input {
    text-align: right;
  }
}

@layer utilities {
  .arabic-text {
    font-family: "Arabic Typesetting", "Amiri", "Traditional Arabic", serif;
    font-size: 1.2rem;
    line-height: 2;
    direction: rtl;
  }
}
*/


// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/types/recommendation.ts
// ─────────────────────────────────────────────────────────────────────────────

export interface Recommendation {
  العبارة: string;   // anchor — verbatim substring from the source text
  الخطأ: string;    // error description
  التصحيح: string;  // corrected replacement, same span as anchor
  // Added by consistency-check post-processing, never sent to the model
  _flagReason?: "leaked_uncorrected_span";
  _conflictsWith?: string;
}

export interface ChunkResponse {
  التوصيات: Recommendation[];
}

export interface ChunkResult {
  clean: Recommendation[];
  flagged: Recommendation[];
  stats: ConsistencyStats;
}

export interface ConsistencyStats {
  total: number;
  noOp: number;
  leaked: number;
  malformed: number;
  clean: number;
}

export interface MergedResult {
  clean: Recommendation[];
  flagged: Recommendation[];
  stats: ConsistencyStats;
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/types/featureConfig.ts
// ─────────────────────────────────────────────────────────────────────────────

export type PlanTier = "testing" | "production";
export type CustomInstructionsMode = "none" | "additive" | "override";
export type ModelId =
  | "command-r7b-arabic-02-2025"
  | "command-a-plus-05-2026";

export interface FeatureConfig {
  // ── Plan tier ──────────────────────────────────────────────────────────────
  tier: PlanTier;

  // ── Model ──────────────────────────────────────────────────────────────────
  modelId: ModelId;

  // ── Input/output limits ────────────────────────────────────────────────────
  // Max characters per chunk sent to the model.
  // A rough token estimate is charLimit / 4.
  maxChunkChars: number;
  // Max tokens the model may emit per response (Cohere cap: 4000).
  maxOutputTokens: number;

  // ── Multi-turn ─────────────────────────────────────────────────────────────
  // When true, chunks are sent as sequential turns in one conversation.
  // When false, each chunk is an independent stateless call.
  multiTurn: boolean;

  // ── Rate limiting ──────────────────────────────────────────────────────────
  // Max requests per minute (enforced client-side in Testing tier).
  requestsPerMinute: number;
  // Monthly call ceiling (trial: 1000, production: determined by plan).
  monthlyCallCeiling: number | null; // null = unlimited

  // ── System prompt / custom instructions ───────────────────────────────────
  customInstructionsMode: CustomInstructionsMode;
  // Only used when mode is 'additive' or 'override'.
  customInstructions: string;

  // ── Model inference params ─────────────────────────────────────────────────
  temperature: number;
  seed: number;
  thinkingDisabled: boolean;
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/types/cohere.ts
// ─────────────────────────────────────────────────────────────────────────────

export interface CohereMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CohereChatRequest {
  model: string;
  messages: CohereMessage[];
  response_format: { type: "json_object" };
  temperature: number;
  seed: number;
  max_tokens: number;
  thinking?: { type: "disabled" };
}

export interface CohereChatResponse {
  message?: {
    content?: Array<{ type: string; text: string }>;
  };
  // Older V2 response shape fallback
  text?: string;
  finish_reason?: string;
}


// ═════════════════════════════════════════════════════════════════════════════
// FEATURE CONFIG — plan definitions
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/config/featureConfig.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { FeatureConfig } from "../types/featureConfig";

// ── Structural prompt layer ───────────────────────────────────────────────────
// This layer is ALWAYS appended last, even in override mode.
// It encodes the contract the parser + consistency-check depend on.
// It must never be user-overridable.
export const STRUCTURAL_PROMPT_LAYER = `
بصرف النظر عن أي تعليمات أخرى، يجب الالتزام بالتنسيق والقواعد البنيوية التالية دون أي استثناء:
- أخرج النتائج بصيغة JSON بالشكل التالي حصراً: { "التوصيات": [ { "العبارة": "...", "الخطأ": "...", "التصحيح": "..." } ] }
- "العبارة" يجب أن تكون نسخة طبق الأصل من النص الأصلي.
- إذا لم تجد أي أخطاء أخرج: { "التوصيات": [] }
- لا تُخرج أي نص خارج كائن JSON.
`.trim();

// ── Default configs per tier ──────────────────────────────────────────────────

export const TESTING_DEFAULTS: FeatureConfig = {
  tier: "testing",
  modelId: "command-r7b-arabic-02-2025",
  maxChunkChars: 2000,      // ~500 tokens per chunk
  maxOutputTokens: 4000,    // Cohere model cap
  multiTurn: true,
  requestsPerMinute: 20,    // Cohere trial hard limit
  monthlyCallCeiling: 1000, // Cohere trial hard limit
  customInstructionsMode: "additive",
  customInstructions: "",
  temperature: 0.4,         // empirically found floor from testing
  seed: 42,
  thinkingDisabled: true,
};

export const PRODUCTION_DEFAULTS: FeatureConfig = {
  tier: "production",
  modelId: "command-r7b-arabic-02-2025",
  maxChunkChars: 4000,
  maxOutputTokens: 4000,
  multiTurn: true,
  requestsPerMinute: Infinity, // no client-side throttle in production
  monthlyCallCeiling: null,    // server-enforced, not client-tracked
  customInstructionsMode: "additive",
  customInstructions: "",
  temperature: 0.4,
  seed: 42,
  thinkingDisabled: true,
};

export const AVAILABLE_MODELS: Array<{ id: FeatureConfig["modelId"]; label: string }> = [
  { id: "command-r7b-arabic-02-2025", label: "Command R7B Arabic (default)" },
  { id: "command-a-plus-05-2026",     label: "Command A+ (May 2026)"        },
];


// ═════════════════════════════════════════════════════════════════════════════
// LIB — core modules
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/lib/chunker.ts
// ─────────────────────────────────────────────────────────────────────────────
// Splits Arabic text into chunks of maxChars, respecting sentence/paragraph
// boundaries where possible (splits on Arabic sentence terminators and newlines
// before falling back to the hard character limit).

const ARABIC_SENTENCE_BREAKS = /[.!?؟।\n]+/g;
const CHUNK_DELIMITER_OPEN   = "=== المقطع الحالي ===";
const CHUNK_DELIMITER_CLOSE  = "=== نهاية المقطع ===";

export function wrapChunk(text: string): string {
  return `${CHUNK_DELIMITER_OPEN}\n${text.trim()}\n${CHUNK_DELIMITER_CLOSE}`;
}

export function splitIntoChunks(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let current = "";

  // Tokenise on sentence breaks, keeping the delimiter attached to each segment
  const segments = text.split(ARABIC_SENTENCE_BREAKS);

  for (const seg of segments) {
    if (!seg.trim()) continue;
    if ((current + seg).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = seg;
    } else {
      current += (current ? " " : "") + seg;
    }
  }

  if (current.trim()) chunks.push(current.trim());

  // Safety pass: hard-split any chunk still exceeding maxChars
  return chunks.flatMap(c =>
    c.length <= maxChars
      ? [c]
      : Array.from({ length: Math.ceil(c.length / maxChars) }, (_, i) =>
          c.slice(i * maxChars, (i + 1) * maxChars)
        )
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/lib/promptAssembler.ts
// ─────────────────────────────────────────────────────────────────────────────

import { STRUCTURAL_PROMPT_LAYER } from "../config/featureConfig";
import type { FeatureConfig } from "../types/featureConfig";
import type { CohereMessage } from "../types/cohere";
import { wrapChunk } from "./chunker";

// Reads the system prompt at build time via Vite's ?raw import.
// The file lives at src/prompts/systemPrompt.ar.md.
// In dev mode, the Playground editor can override this in-memory.
import rawSystemPrompt from "../prompts/systemPrompt.ar.md?raw";

export function getSystemPrompt(): string {
  return rawSystemPrompt;
}

/**
 * Assembles the final system prompt string from:
 *   1. The base editorial-layer prompt (from the .md file or dev override)
 *   2. User custom instructions (additive: appended; override: replaces editorial layer)
 *   3. The structural layer (always last, never overridable)
 */
export function assembleSystemPrompt(
  cfg: FeatureConfig,
  editorialOverride?: string  // supplied by Playground in dev mode
): string {
  const editorial = editorialOverride ?? rawSystemPrompt;

  if (cfg.customInstructionsMode === "override" && cfg.customInstructions.trim()) {
    // Replace the editorial layer with user instructions,
    // but always append the structural layer last.
    return [
      cfg.customInstructions.trim(),
      STRUCTURAL_PROMPT_LAYER,
    ].join("\n\n---\n\n");
  }

  if (cfg.customInstructionsMode === "additive" && cfg.customInstructions.trim()) {
    return [
      editorial,
      `تعليمات إضافية من المستخدم (طبّقها بما يتوافق مع القواعد أعلاه، دون مخالفتها):\n${cfg.customInstructions.trim()}`,
      STRUCTURAL_PROMPT_LAYER,
    ].join("\n\n---\n\n");
  }

  // "none" mode — base prompt + structural layer only
  return [editorial, STRUCTURAL_PROMPT_LAYER].join("\n\n---\n\n");
}

/**
 * Builds the full messages array for a multi-turn chunked session.
 *
 * Turn 1  →  system + user(chunk1)
 * Turn N  →  ...accumulated history... + user(chunkN)
 *
 * Each chunk is wrapped in === المقطع الحالي === delimiters so the model
 * has an unambiguous boundary when the conversation history accumulates.
 */
export function buildMultiTurnMessages(
  chunks: string[],
  currentChunkIndex: number,
  history: CohereMessage[],  // accumulated from previous turns in this session
  systemPrompt: string,
  isFirstChunk: boolean
): CohereMessage[] {
  const chunkInstruction =
    currentChunkIndex === 0
      ? "دقّق المقطع التالي بحثاً عن جميع الأخطاء اللغوية:"
      : "دقّق المقطع التالي بحثاً عن جميع الأخطاء اللغوية. لا تُعِد ذكر أي خطأ ورد في مقطع سابق:";

  const userMessage: CohereMessage = {
    role: "user",
    content: `${chunkInstruction}\n\n${wrapChunk(chunks[currentChunkIndex])}`,
  };

  if (isFirstChunk) {
    return [
      { role: "system", content: systemPrompt },
      userMessage,
    ];
  }

  // Subsequent turns: re-send history (system already in position 0) + new user turn
  return [...history, userMessage];
}

/**
 * Stateless (non-multi-turn) variant — each chunk is a fresh conversation.
 */
export function buildStatelessMessages(
  chunk: string,
  systemPrompt: string
): CohereMessage[] {
  return [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `دقّق المقطع التالي بحثاً عن جميع الأخطاء اللغوية:\n\n${wrapChunk(chunk)}`,
    },
  ];
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/lib/rateLimiter.ts
// ─────────────────────────────────────────────────────────────────────────────
// Sliding-window token-bucket rate limiter.
// Used in Testing tier to stay within Cohere's 20 req/min trial cap.

export class RateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private timestamps: number[] = [];

  constructor(requestsPerMinute: number) {
    this.windowMs    = 60_000;
    this.maxRequests = requestsPerMinute;
  }

  /**
   * Returns the number of milliseconds to wait before the next request
   * can be made without exceeding the rate limit. 0 = proceed immediately.
   */
  msUntilNextSlot(): number {
    const now    = Date.now();
    const window = now - this.windowMs;

    // Drop timestamps outside the sliding window
    this.timestamps = this.timestamps.filter(t => t > window);

    if (this.timestamps.length < this.maxRequests) return 0;

    // Oldest timestamp in the window; wait until it falls out
    const oldest = this.timestamps[0];
    return oldest + this.windowMs - now + 50; // +50ms buffer
  }

  /**
   * Call this immediately after a request is dispatched.
   */
  record(): void {
    this.timestamps.push(Date.now());
  }

  /**
   * Waits the appropriate time then records the slot.
   * Wraps msUntilNextSlot + record() for convenience.
   */
  async acquireSlot(): Promise<void> {
    const wait = this.msUntilNextSlot();
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    this.record();
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/lib/consistencyCheck.ts
// ─────────────────────────────────────────────────────────────────────────────
// Post-processes a chunk's raw recommendations BEFORE merging into final output.
// Ported directly from consistency-check.js with TypeScript types applied.

import type { Recommendation, ChunkResult, ConsistencyStats, MergedResult } from "../types/recommendation";

function emptyStats(): ConsistencyStats {
  return { total: 0, noOp: 0, leaked: 0, malformed: 0, clean: 0 };
}

export function checkRecommendations(recs: Recommendation[]): ChunkResult {
  if (!Array.isArray(recs)) return { clean: [], flagged: [], stats: emptyStats() };

  const stats = emptyStats();
  stats.total = recs.length;

  // ── Pass 1: filter no-op and malformed entries ────────────────────────────
  const afterNoOpFilter: Recommendation[] = [];

  for (const rec of recs) {
    const anchor     = (rec["العبارة"]  ?? "").trim();
    const correction = (rec["التصحيح"] ?? "").trim();

    if (!anchor || !correction || !rec["الخطأ"]?.trim()) {
      stats.malformed++;
      continue;
    }

    if (anchor === correction) {
      stats.noOp++;
      continue; // silently drop
    }

    afterNoOpFilter.push(rec);
  }

  // ── Pass 2: detect leaked / uncorrected spans ─────────────────────────────
  const clean: Recommendation[]   = [];
  const flagged: Recommendation[] = [];

  for (let i = 0; i < afterNoOpFilter.length; i++) {
    const current    = afterNoOpFilter[i];
    const correction = current["التصحيح"];
    let leakedFrom: Recommendation | null = null;

    for (let j = 0; j < afterNoOpFilter.length; j++) {
      if (i === j) continue;
      const otherAnchor = afterNoOpFilter[j]["العبارة"].trim();

      // Guard against short particles causing false positives
      if (otherAnchor.length >= 4 && correction.includes(otherAnchor)) {
        leakedFrom = afterNoOpFilter[j];
        break;
      }
    }

    if (leakedFrom) {
      stats.leaked++;
      flagged.push({
        ...current,
        _flagReason: "leaked_uncorrected_span",
        _conflictsWith: leakedFrom["العبارة"],
      });
    } else {
      clean.push(current);
    }
  }

  stats.clean = clean.length;
  return { clean, flagged, stats };
}

export function mergeChunkResults(chunkResultsArray: ChunkResult[]): MergedResult {
  const allClean:   Recommendation[] = [];
  const allFlagged: Recommendation[] = [];
  const seenAnchors = new Set<string>();
  const totals = emptyStats();

  for (const { clean, flagged, stats } of chunkResultsArray) {
    totals.total    += stats.total;
    totals.noOp     += stats.noOp;
    totals.leaked   += stats.leaked;
    totals.malformed += stats.malformed;

    for (const rec of clean) {
      const anchor = rec["العبارة"].trim();
      if (seenAnchors.has(anchor)) continue;
      seenAnchors.add(anchor);
      allClean.push(rec);
    }
    allFlagged.push(...flagged);
  }

  totals.clean = allClean.length;
  return { clean: allClean, flagged: allFlagged, stats: totals };
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/lib/cohereClient.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { CohereChatRequest, CohereChatResponse, CohereMessage } from "../types/cohere";
import type { ChunkResponse, Recommendation } from "../types/recommendation";
import type { FeatureConfig } from "../types/featureConfig";

const COHERE_CHAT_V2 = "https://api.cohere.com/v2/chat";

function extractText(data: CohereChatResponse): string {
  // V2 shape: data.message.content[0].text
  const fromV2 = data.message?.content?.find(b => b.type === "text")?.text;
  if (fromV2) return fromV2;
  // Fallback
  return data.text ?? "";
}

function safeParseChunkResponse(raw: string): ChunkResponse {
  const cleaned = raw
    .replace(/^\uFEFF/, "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return { التوصيات: [] };

  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const recs   = parsed["التوصيات"];
    if (!Array.isArray(recs)) return { التوصيات: [] };
    return { التوصيات: recs as Recommendation[] };
  } catch {
    return { التوصيات: [] };
  }
}

export async function callCohere(
  messages: CohereMessage[],
  cfg: FeatureConfig,
  apiKey: string
): Promise<ChunkResponse> {
  const body: CohereChatRequest = {
    model: cfg.modelId,
    messages,
    response_format: { type: "json_object" },
    temperature: cfg.temperature,
    seed: cfg.seed,
    max_tokens: cfg.maxOutputTokens,
    ...(cfg.thinkingDisabled ? { thinking: { type: "disabled" } } : {}),
  };

  const resp = await fetch(COHERE_CHAT_V2, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Accept":        "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (resp.status === 429) {
    const retryAfter = resp.headers.get("retry-after");
    const err = Object.assign(new Error("Rate limit reached"), {
      isRateLimit:    true,
      retryAfterSecs: retryAfter ? parseInt(retryAfter, 10) : null,
    });
    throw err;
  }

  if (!resp.ok) {
    let detail = "";
    try {
      const e = await resp.json() as { message?: string };
      detail = e.message ?? "";
    } catch { /* ignore */ }
    throw new Error(`Cohere API error ${resp.status}${detail ? ": " + detail : ""}`);
  }

  const data = await resp.json() as CohereChatResponse;
  const raw  = extractText(data);
  return safeParseChunkResponse(raw);
}

/**
 * Tests the connection by sending a minimal request.
 * Returns a structured result for the ConnectionPanel component.
 */
export interface ConnectionTestResult {
  ok: boolean;
  status: number | null;
  stage: string;
  detail: string;
  warn?: boolean;
}

export async function testCohereConnection(
  apiKey: string,
  modelId: string
): Promise<ConnectionTestResult> {
  let resp: Response;

  try {
    resp = await fetch(COHERE_CHAT_V2, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Accept":        "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: "Reply with PONG and nothing else." },
          { role: "user",   content: "PING"                              },
        ],
        response_format: { type: "json_object" },
        max_tokens: 16,
        temperature: 0,
      } satisfies Partial<CohereChatRequest>),
    });
  } catch (e) {
    return {
      ok: false, status: null, stage: "Network",
      detail: `Could not reach api.cohere.com. Check your internet connection.\n\n${String(e)}`,
    };
  }

  if (resp.status === 401) return { ok: false, status: 401, stage: "Authentication", detail: "API key rejected (401). Check that your key is complete and has no extra spaces." };
  if (resp.status === 403) return { ok: false, status: 403, stage: "Authorization",  detail: "Access denied (403). Verify your key has the correct permissions." };
  if (resp.status === 429) return { ok: false, status: 429, stage: "Rate Limit",     detail: "Rate limit hit (429). Wait and try again." };
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    return { ok: false, status: resp.status, stage: "HTTP Error", detail: `HTTP ${resp.status}\n\n${body}` };
  }

  const data = await resp.json() as CohereChatResponse;
  const text = extractText(data).trim();

  if (!text) {
    return { ok: false, status: resp.status, stage: "Response Shape", detail: "HTTP 200 but no text in response body." };
  }

  return { ok: true, status: 200, stage: "Connected", detail: `Model replied: "${text.slice(0, 200)}"` };
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/lib/usageCounter.ts
// ─────────────────────────────────────────────────────────────────────────────
// Tracks the monthly API call count (trial ceiling: 1,000/month).
// Uses localStorage in the self-hosted build (no sandbox restriction).
// Intentionally simple — a localStorage counter is imperfect (resettable)
// but sufficient until a backend provides an authoritative count.

const STORAGE_KEY = "cohere_monthly_calls";
const STORAGE_META = "cohere_monthly_meta";

interface UsageMeta {
  month: string; // "YYYY-MM"
  count: number;
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function getMonthlyUsage(): UsageMeta {
  try {
    const raw = localStorage.getItem(STORAGE_META);
    if (raw) {
      const meta = JSON.parse(raw) as UsageMeta;
      if (meta.month === currentMonth()) return meta;
    }
  } catch { /* ignore */ }
  // First use or new month — reset
  return { month: currentMonth(), count: 0 };
}

export function incrementMonthlyUsage(): UsageMeta {
  const meta = getMonthlyUsage();
  meta.count++;
  try {
    localStorage.setItem(STORAGE_META, JSON.stringify(meta));
    localStorage.setItem(STORAGE_KEY, String(meta.count));
  } catch { /* ignore */ }
  return meta;
}

export function resetMonthlyUsage(): void {
  const meta: UsageMeta = { month: currentMonth(), count: 0 };
  try {
    localStorage.setItem(STORAGE_META, JSON.stringify(meta));
    localStorage.setItem(STORAGE_KEY, "0");
  } catch { /* ignore */ }
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/lib/proofreadingSession.ts
// ─────────────────────────────────────────────────────────────────────────────
// Orchestrates the full proofreading run:
//   split → [rate-limit → call → consistency-check → accumulate] → merge
// Emits progress events via a callback so the UI can update reactively.

import { splitIntoChunks } from "./chunker";
import { assembleSystemPrompt, buildMultiTurnMessages, buildStatelessMessages } from "./promptAssembler";
import { callCohere } from "./cohereClient";
import { checkRecommendations, mergeChunkResults } from "./consistencyCheck";
import { RateLimiter } from "./rateLimiter";
import { incrementMonthlyUsage } from "./usageCounter";
import type { FeatureConfig } from "../types/featureConfig";
import type { ChunkResult, MergedResult } from "../types/recommendation";
import type { CohereMessage } from "../types/cohere";

export type ChunkStatus = "pending" | "running" | "done" | "error";

export interface ChunkProgress {
  index: number;
  total: number;
  status: ChunkStatus;
  errorMessage?: string;
}

export interface SessionOptions {
  text: string;
  apiKey: string;
  cfg: FeatureConfig;
  promptOverride?: string; // dev Playground: in-memory edited prompt
  onProgress: (p: ChunkProgress) => void;
}

export interface SessionResult {
  merged: MergedResult;
  aborted: boolean;
  abortReason?: string;
}

export async function runProofreadingSession(
  opts: SessionOptions
): Promise<SessionResult> {
  const { text, apiKey, cfg, promptOverride, onProgress } = opts;

  const chunks     = splitIntoChunks(text, cfg.maxChunkChars);
  const systemPrompt = assembleSystemPrompt(cfg, promptOverride);
  const limiter    = new RateLimiter(cfg.requestsPerMinute);
  const history: CohereMessage[] = [];
  const chunkResults: ChunkResult[] = [];

  let aborted = false;
  let abortReason: string | undefined;

  for (let i = 0; i < chunks.length; i++) {
    onProgress({ index: i, total: chunks.length, status: "running" });

    // Rate-limit slot acquisition (no-op if tier === production / Infinity rpm)
    if (isFinite(cfg.requestsPerMinute)) {
      await limiter.acquireSlot();
    }

    const messages = cfg.multiTurn
      ? buildMultiTurnMessages(chunks, i, history, systemPrompt, i === 0)
      : buildStatelessMessages(chunks[i], systemPrompt);

    try {
      const raw = await callCohere(messages, cfg, apiKey);
      incrementMonthlyUsage();

      // Accumulate history for multi-turn (assistant reply appended)
      if (cfg.multiTurn) {
        const assistantText = JSON.stringify(raw);
        history.push(...messages.slice(history.length)); // new user turn(s)
        history.push({ role: "assistant", content: assistantText });
      }

      const checked = checkRecommendations(raw.التوصيات);
      chunkResults.push(checked);
      onProgress({ index: i, total: chunks.length, status: "done" });

    } catch (err: unknown) {
      const e = err as { isRateLimit?: boolean; retryAfterSecs?: number | null; message?: string };
      onProgress({ index: i, total: chunks.length, status: "error", errorMessage: e.message });

      if (e.isRateLimit) {
        aborted     = true;
        abortReason = `Rate limit hit on chunk ${i + 1}/${chunks.length}. Remaining chunks skipped.`;
        // Mark remaining chunks as pending-skipped
        for (let j = i + 1; j < chunks.length; j++) {
          onProgress({ index: j, total: chunks.length, status: "error", errorMessage: "Skipped due to rate limit" });
        }
        break;
      }
      // Non-rate-limit error: push empty result, continue to next chunk
      chunkResults.push({ clean: [], flagged: [], stats: { total: 0, noOp: 0, leaked: 0, malformed: 0, clean: 0 } });
    }
  }

  return {
    merged: mergeChunkResults(chunkResults),
    aborted,
    abortReason,
  };
}


// ═════════════════════════════════════════════════════════════════════════════
// APP STATE — context
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/context/AppContext.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useReducer, type Dispatch } from "react";
import type { FeatureConfig } from "../types/featureConfig";
import type { MergedResult } from "../types/recommendation";
import type { ChunkProgress } from "../lib/proofreadingSession";
import { TESTING_DEFAULTS } from "../config/featureConfig";

export type AppTab = "config" | "input" | "output" | "playground";

export interface AppState {
  // ── API credentials ────────────────────────────────────────────────────────
  apiKey: string;

  // ── Feature config ─────────────────────────────────────────────────────────
  cfg: FeatureConfig;

  // ── Input ──────────────────────────────────────────────────────────────────
  inputText: string;
  inputFileName: string;

  // ── Session state ──────────────────────────────────────────────────────────
  running: boolean;
  progress: ChunkProgress[];
  result: MergedResult | null;
  sessionError: string;

  // ── UI ─────────────────────────────────────────────────────────────────────
  activeTab: AppTab;

  // ── Dev: in-memory prompt override (Playground tab) ────────────────────────
  promptOverride: string | undefined;
}

export type AppAction =
  | { type: "SET_API_KEY"; key: string }
  | { type: "SET_CFG"; cfg: Partial<FeatureConfig> }
  | { type: "SET_INPUT"; text: string; fileName?: string }
  | { type: "SESSION_START" }
  | { type: "SESSION_PROGRESS"; progress: ChunkProgress }
  | { type: "SESSION_DONE"; result: MergedResult }
  | { type: "SESSION_ERROR"; message: string }
  | { type: "SET_TAB"; tab: AppTab }
  | { type: "SET_PROMPT_OVERRIDE"; prompt: string | undefined };

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_API_KEY":
      return { ...state, apiKey: action.key };
    case "SET_CFG":
      return { ...state, cfg: { ...state.cfg, ...action.cfg } };
    case "SET_INPUT":
      return { ...state, inputText: action.text, inputFileName: action.fileName ?? "" };
    case "SESSION_START":
      return { ...state, running: true, progress: [], result: null, sessionError: "" };
    case "SESSION_PROGRESS": {
      const updated = [...state.progress];
      updated[action.progress.index] = action.progress;
      return { ...state, progress: updated };
    }
    case "SESSION_DONE":
      return { ...state, running: false, result: action.result };
    case "SESSION_ERROR":
      return { ...state, running: false, sessionError: action.message };
    case "SET_TAB":
      return { ...state, activeTab: action.tab };
    case "SET_PROMPT_OVERRIDE":
      return { ...state, promptOverride: action.prompt };
    default:
      return state;
  }
}

const initialState: AppState = {
  apiKey: import.meta.env.VITE_COHERE_API_KEY ?? "",
  cfg: TESTING_DEFAULTS,
  inputText: "",
  inputFileName: "",
  running: false,
  progress: [],
  result: null,
  sessionError: "",
  activeTab: "config",
  promptOverride: undefined,
};

const StateCtx    = createContext<AppState>(initialState);
const DispatchCtx = createContext<Dispatch<AppAction>>(() => undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        {children}
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export const useAppState    = () => useContext(StateCtx);
export const useAppDispatch = () => useContext(DispatchCtx);


// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/shared/ConnectionPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { testCohereConnection, type ConnectionTestResult } from "../../lib/cohereClient";
import { useAppState } from "../../context/AppContext";

export function ConnectionPanel() {
  const { apiKey, cfg } = useAppState();
  const [result,    setResult]    = useState<ConnectionTestResult | null>(null);
  const [testing,   setTesting]   = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setShowDebug(false);
    const r = await testCohereConnection(apiKey, cfg.modelId);
    setResult(r);
    setTesting(false);
    setShowDebug(true);
  };

  const dot = result
    ? result.ok ? "bg-green-500" : "bg-red-500"
    : testing ? "bg-yellow-500 animate-pulse" : "bg-gray-300";

  const label = testing
    ? "Testing…"
    : result
      ? result.ok ? `Connected — ${result.stage}` : `Failed — ${result.stage}`
      : apiKey ? "Credentials entered — not tested" : "No API key";

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm mb-4">
      <h3 className="font-bold text-navy-900 mb-4 border-b pb-2">🔑 Cohere Connection</h3>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
        <span className="text-sm font-semibold text-gray-600">{label}</span>
      </div>
      <button
        onClick={handleTest}
        disabled={!apiKey || testing}
        className="bg-[#1c2b4a] text-white rounded-lg px-4 py-2 text-sm font-semibold
                   disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2d3f6b] transition-colors"
      >
        {testing ? "⏳ Testing…" : "⚡ Test Connection"}
      </button>
      {result && (
        <div className="mt-3">
          <button
            onClick={() => setShowDebug(v => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 font-semibold"
          >
            {showDebug ? "▾ Hide" : "▸ Show"} debug
          </button>
          {showDebug && (
            <pre className={`mt-2 text-xs rounded-lg p-3 whitespace-pre-wrap break-words max-h-40 overflow-y-auto
              ${result.ok ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              {result.detail}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/shared/UsageMonitor.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { getMonthlyUsage, resetMonthlyUsage } from "../../lib/usageCounter";
import { useAppState } from "../../context/AppContext";

export function UsageMonitor() {
  const { cfg } = useAppState();
  const [usage, setUsage] = useState(getMonthlyUsage());

  // Refresh whenever the component mounts or the window regains focus
  useEffect(() => {
    const refresh = () => setUsage(getMonthlyUsage());
    window.addEventListener("focus", refresh);
    refresh();
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const ceiling  = cfg.monthlyCallCeiling;
  const pct      = ceiling ? Math.min(100, Math.round((usage.count / ceiling) * 100)) : 0;
  const barColor = !ceiling || pct < 70 ? "bg-green-500" : pct < 90 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm mb-4">
      <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">📊 Monthly Usage</h3>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-500">{usage.month}</span>
        <span className="font-bold text-[#1c2b4a]">
          {usage.count.toLocaleString()}
          {ceiling ? ` / ${ceiling.toLocaleString()}` : ""} calls
        </span>
      </div>
      {ceiling && (
        <>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
            <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-400">{pct}% of monthly trial ceiling used</p>
        </>
      )}
      {!ceiling && (
        <p className="text-xs text-gray-400">Production tier — no monthly ceiling tracked client-side.</p>
      )}
      <button
        onClick={() => { resetMonthlyUsage(); setUsage(getMonthlyUsage()); }}
        className="mt-3 text-xs text-red-400 hover:text-red-600 underline"
      >
        Reset counter
      </button>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/shared/ChunkProgressList.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { ChunkProgress } from "../../lib/proofreadingSession";

const STATUS_ICON:  Record<string, string> = { pending: "○", running: "◌", done: "✓", error: "✗" };
const STATUS_COLOR: Record<string, string> = {
  pending: "text-gray-400",
  running: "text-yellow-500 animate-spin",
  done:    "text-green-600",
  error:   "text-red-500",
};

interface Props {
  progress: ChunkProgress[];
}

export function ChunkProgressList({ progress }: Props) {
  if (progress.length === 0) return null;
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm mt-4">
      <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">Analysis Progress</h3>
      {progress.map((p) => (
        <div key={p.index} className="flex items-center gap-3 py-2 border-b last:border-0">
          <span className={`text-lg w-6 text-center ${STATUS_COLOR[p.status]}`}>
            {STATUS_ICON[p.status]}
          </span>
          <span className="flex-1 text-sm text-gray-700">
            Chunk {p.index + 1} of {p.total}
          </span>
          {p.errorMessage && (
            <span className="text-xs text-red-400 truncate max-w-xs">{p.errorMessage}</span>
          )}
          <span className="text-xs font-semibold capitalize text-gray-500">{p.status}</span>
        </div>
      ))}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/tabs/ConfigTab.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useAppState, useAppDispatch } from "../../context/AppContext";
import { TESTING_DEFAULTS, PRODUCTION_DEFAULTS, AVAILABLE_MODELS } from "../../config/featureConfig";
import { ConnectionPanel } from "../shared/ConnectionPanel";
import { UsageMonitor } from "../shared/UsageMonitor";
import type { FeatureConfig, CustomInstructionsMode } from "../../types/featureConfig";

export function ConfigTab() {
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const { cfg, apiKey } = state;

  const set = (patch: Partial<FeatureConfig>) => dispatch({ type: "SET_CFG", cfg: patch });

  const switchTier = (tier: "testing" | "production") => {
    const defaults = tier === "testing" ? TESTING_DEFAULTS : PRODUCTION_DEFAULTS;
    dispatch({ type: "SET_CFG", cfg: defaults });
  };

  return (
    <div className="space-y-4">

      {/* API Key */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">🔑 API Key</h3>
        <p className="text-xs text-red-500 mb-2">
          ⚠ In production, move your key to a server-side proxy. Never ship it to the client.
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={e => dispatch({ type: "SET_API_KEY", key: e.target.value })}
          placeholder="co-..."
          className="w-full border rounded-lg px-3 py-2 text-sm outline-none
                     focus:border-[#1c2b4a] transition-colors"
        />
      </div>

      <ConnectionPanel />

      {/* Tier toggle */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">⚙ Plan Tier</h3>
        <div className="flex gap-3">
          {(["testing", "production"] as const).map(tier => (
            <button
              key={tier}
              onClick={() => switchTier(tier)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors
                ${cfg.tier === tier
                  ? "bg-[#1c2b4a] text-white border-[#1c2b4a]"
                  : "bg-white text-gray-600 border-gray-300 hover:border-[#1c2b4a]"}`}
            >
              {tier === "testing" ? "🔬 Testing" : "🚀 Production"}
            </button>
          ))}
        </div>
        {cfg.tier === "production" && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠ Command A+ production access requires contacting Cohere sales — it is not self-serve.
          </p>
        )}
      </div>

      {/* Model selection */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">🤖 Model</h3>
        <select
          value={cfg.modelId}
          onChange={e => set({ modelId: e.target.value as FeatureConfig["modelId"] })}
          className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1c2b4a]"
        >
          {AVAILABLE_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Inference params */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">🌡 Inference Parameters</h3>
        <div className="space-y-4">
          {/* Temperature */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="font-semibold text-gray-600">Temperature</label>
              <span className="font-bold text-[#1c2b4a]">{cfg.temperature.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400 mb-1">
              Note: values below 0.4 have been empirically observed to produce degraded output with this model.
              Re-verify before lowering.
            </p>
            <input
              type="range" min={0} max={1} step={0.05} value={cfg.temperature}
              onChange={e => set({ temperature: Number(e.target.value) })}
              className="w-full accent-[#1c2b4a]"
            />
          </div>
          {/* Seed */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="font-semibold text-gray-600">Seed</label>
              <span className="font-bold text-[#1c2b4a]">{cfg.seed}</span>
            </div>
            <input
              type="number" value={cfg.seed}
              onChange={e => set({ seed: parseInt(e.target.value, 10) || 42 })}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1c2b4a]"
            />
          </div>
          {/* Max chunk chars */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="font-semibold text-gray-600">Max Chunk Characters</label>
              <span className="font-bold text-[#1c2b4a]">{cfg.maxChunkChars.toLocaleString()}</span>
            </div>
            <input
              type="range" min={500} max={8000} step={100} value={cfg.maxChunkChars}
              onChange={e => set({ maxChunkChars: Number(e.target.value) })}
              className="w-full accent-[#1c2b4a]"
            />
          </div>
        </div>
      </div>

      {/* Multi-turn toggle */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">🔄 Multi-Turn Chunking</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set({ multiTurn: !cfg.multiTurn })}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative
              ${cfg.multiTurn ? "bg-[#1c2b4a]" : "bg-gray-300"}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all
              ${cfg.multiTurn ? "left-6" : "left-1"}`} />
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {cfg.multiTurn ? "Multi-turn (chunks as conversation turns)" : "Stateless (independent calls per chunk)"}
          </span>
        </label>
        <p className="text-xs text-gray-400 mt-2">
          Multi-turn sends the system prompt once and appends chunks. Stateless re-sends the full system prompt per chunk.
        </p>
      </div>

      {/* Custom instructions */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">📋 Custom Instructions</h3>
        <div className="flex gap-2 mb-3">
          {(["none", "additive", "override"] as CustomInstructionsMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => set({ customInstructionsMode: mode })}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                ${cfg.customInstructionsMode === mode
                  ? "bg-[#1c2b4a] text-white border-[#1c2b4a]"
                  : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"}`}
            >
              {mode === "none" ? "None" : mode === "additive" ? "Additive" : "Override"}
            </button>
          ))}
        </div>
        {cfg.customInstructionsMode === "override" && (
          <p className="text-xs text-amber-600 mb-2">
            Override replaces editorial preferences only — structural output rules are always enforced.
          </p>
        )}
        {cfg.customInstructionsMode !== "none" && (
          <textarea
            dir="rtl"
            value={cfg.customInstructions}
            onChange={e => set({ customInstructions: e.target.value })}
            rows={4}
            placeholder="أدخل تعليمات إضافية هنا…"
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none
                       focus:border-[#1c2b4a] arabic-text resize-y"
          />
        )}
      </div>

      <UsageMonitor />
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/tabs/InputTab.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from "react";
import { useAppState, useAppDispatch } from "../../context/AppContext";
import { runProofreadingSession } from "../../lib/proofreadingSession";
import { ChunkProgressList } from "../shared/ChunkProgressList";

export function InputTab() {
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const fileRef  = useRef<HTMLInputElement>(null);

  const { inputText, inputFileName, running, progress, sessionError, apiKey, cfg, promptOverride } = state;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => dispatch({ type: "SET_INPUT", text: String(ev.target?.result ?? ""), fileName: file.name });
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    dispatch({ type: "SESSION_START" });
    try {
      const result = await runProofreadingSession({
        text: inputText,
        apiKey,
        cfg,
        promptOverride,
        onProgress: p => dispatch({ type: "SESSION_PROGRESS", progress: p }),
      });
      dispatch({ type: "SESSION_DONE", result: result.merged });
      dispatch({ type: "SET_TAB", tab: "output" });
    } catch (e: unknown) {
      dispatch({ type: "SESSION_ERROR", message: String((e as Error).message) });
    }
  };

  const canSubmit = !!inputText.trim() && !!apiKey && !running;

  return (
    <div className="space-y-4">
      {!apiKey && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700">
          ⚠ Enter your Cohere API key in the Configuration tab before starting.
        </div>
      )}

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">✏ Arabic Text</h3>
        <textarea
          dir="rtl"
          value={inputText}
          onChange={e => dispatch({ type: "SET_INPUT", text: e.target.value })}
          placeholder="أدخل النص العربي هنا للتدقيق اللغوي…"
          rows={10}
          className="w-full border rounded-lg px-3 py-2 arabic-text outline-none
                     focus:border-[#1c2b4a] resize-y"
        />
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-xs text-gray-400">{inputText.length.toLocaleString()} characters</span>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 hover:border-gray-500 transition-colors"
          >
            Upload .txt
          </button>
          {inputFileName && <span className="text-xs text-green-600">✓ {inputFileName}</span>}
          <button
            onClick={() => dispatch({ type: "SET_INPUT", text: "" })}
            className="text-xs text-red-400 hover:text-red-600"
          >
            Clear
          </button>
        </div>
        <input type="file" accept=".txt,.text" ref={fileRef} onChange={handleFile} className="hidden" />
      </div>

      {sessionError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
          ⚠ {sessionError}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-3.5 bg-[#1c2b4a] text-white font-bold text-lg rounded-xl
                   disabled:opacity-40 disabled:cursor-not-allowed
                   hover:bg-[#2d3f6b] transition-colors"
      >
        {running ? "⏳ Proofreading in progress…" : "▶ Start Proofreading"}
      </button>

      <ChunkProgressList progress={progress} />
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/tabs/OutputTab.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useAppState } from "../../context/AppContext";
import type { Recommendation } from "../../types/recommendation";

function RecommendationCard({ rec, index, flagged }: { rec: Recommendation; index: number; flagged: boolean }) {
  return (
    <div className={`rounded-lg border p-4 mb-3 ${flagged ? "bg-amber-50 border-amber-300" : "bg-white border-gray-200"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
        {flagged && (
          <span className="text-xs bg-amber-200 text-amber-800 rounded px-2 py-0.5 font-semibold">
            ⚠ Needs review — partial fix detected
          </span>
        )}
      </div>
      <div className="space-y-2 text-sm" dir="rtl">
        <div>
          <span className="text-xs font-bold text-gray-500 block mb-0.5">العبارة (Anchor)</span>
          <p className="arabic-text bg-red-50 rounded px-2 py-1 text-red-800 border border-red-100">{rec["العبارة"]}</p>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-500 block mb-0.5">الخطأ (Error)</span>
          <p className="arabic-text bg-gray-50 rounded px-2 py-1 text-gray-700">{rec["الخطأ"]}</p>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-500 block mb-0.5">التصحيح (Correction)</span>
          <p className="arabic-text bg-green-50 rounded px-2 py-1 text-green-800 border border-green-100">{rec["التصحيح"]}</p>
        </div>
        {rec._conflictsWith && (
          <p className="text-xs text-amber-600">
            Conflict: correction still contains anchor from another entry: "{rec._conflictsWith}"
          </p>
        )}
      </div>
    </div>
  );
}

export function OutputTab() {
  const { result } = useAppState();
  const [showFlagged, setShowFlagged] = useState(true);

  if (!result) {
    return (
      <div className="rounded-xl bg-white p-10 shadow-sm text-center text-gray-400">
        <div className="text-4xl mb-3">📄</div>
        Results will appear here after proofreading completes.
      </div>
    );
  }

  const { clean, flagged, stats } = result;

  const handleExport = () => {
    const payload = {
      number_of_errors: String(clean.length + flagged.length),
      clean_recommendations: clean,
      flagged_recommendations: flagged,
      stats,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: "proofreading_result.json" });
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total",    value: stats.total             },
            { label: "Clean",    value: stats.clean,  ok: true  },
            { label: "Flagged",  value: stats.leaked            },
            { label: "No-op",    value: stats.noOp              },
          ].map(({ label, value, ok }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className={`text-xl font-bold ${ok ? "text-green-600" : "text-[#1c2b4a]"}`}>{value}</div>
            </div>
          ))}
        </div>
        <button
          onClick={handleExport}
          className="bg-[#1c2b4a] text-white rounded-lg px-4 py-2 text-sm font-semibold
                     hover:bg-[#2d3f6b] transition-colors"
        >
          ⬇ Export JSON
        </button>
      </div>

      {/* Clean results */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">
          ✅ Clean Recommendations ({clean.length})
        </h3>
        {clean.length === 0
          ? <p className="text-sm text-gray-400">No clean recommendations.</p>
          : clean.map((r, i) => <RecommendationCard key={i} rec={r} index={i} flagged={false} />)
        }
      </div>

      {/* Flagged results */}
      {flagged.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-5">
          <button
            onClick={() => setShowFlagged(v => !v)}
            className="flex items-center gap-2 font-bold text-amber-800 mb-2 w-full text-left"
          >
            <span>{showFlagged ? "▾" : "▸"}</span>
            ⚠ {flagged.length} item{flagged.length !== 1 ? "s" : ""} need review
            <span className="text-xs font-normal text-amber-600 ml-1">(partial fix detected)</span>
          </button>
          {showFlagged && flagged.map((r, i) =>
            <RecommendationCard key={i} rec={r} index={i} flagged />
          )}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/tabs/PlaygroundTab.tsx
// ─────────────────────────────────────────────────────────────────────────────
// DEV ONLY — rendered only when import.meta.env.DEV === true.
// Allows in-memory system prompt editing + raw API request/response inspection.
// Prompt edits can be persisted to disk via the local Express dev server.

import { useState, useEffect } from "react";
import { useAppState, useAppDispatch } from "../../context/AppContext";
import { getSystemPrompt } from "../../lib/promptAssembler";
import { assembleSystemPrompt } from "../../lib/promptAssembler";
import { callCohere } from "../../lib/cohereClient";
import { wrapChunk } from "../../lib/chunker";
import type { CohereMessage } from "../../types/cohere";

const DEV_SERVER = "http://localhost:3001";

export function PlaygroundTab() {
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const { cfg, apiKey, promptOverride } = state;

  const [localPrompt,  setLocalPrompt]  = useState<string>(promptOverride ?? getSystemPrompt());
  const [testChunk,    setTestChunk]    = useState("");
  const [rawRequest,   setRawRequest]   = useState("");
  const [rawResponse,  setRawResponse]  = useState("");
  const [sending,      setSending]      = useState(false);
  const [saveStatus,   setSaveStatus]   = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Keep promptOverride in app state in sync with local editor
  useEffect(() => {
    dispatch({ type: "SET_PROMPT_OVERRIDE", prompt: localPrompt });
  }, [localPrompt, dispatch]);

  // ── Save prompt to disk via dev Express server ────────────────────────────
  const handleSavePrompt = async () => {
    setSaveStatus("saving");
    try {
      const resp = await fetch(`${DEV_SERVER}/api/save-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: localPrompt }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  // ── Test run with a single chunk ──────────────────────────────────────────
  const handleTestRun = async () => {
    if (!testChunk.trim() || !apiKey) return;
    setSending(true);
    setRawRequest("");
    setRawResponse("");

    const systemPrompt = assembleSystemPrompt(cfg, localPrompt);
    const messages: CohereMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `دقّق المقطع التالي:\n\n${wrapChunk(testChunk)}` },
    ];

    const requestBody = {
      model: cfg.modelId,
      messages,
      response_format: { type: "json_object" },
      temperature: cfg.temperature,
      seed: cfg.seed,
      max_tokens: cfg.maxOutputTokens,
      ...(cfg.thinkingDisabled ? { thinking: { type: "disabled" } } : {}),
    };
    setRawRequest(JSON.stringify(requestBody, null, 2));

    try {
      const result = await callCohere(messages, cfg, apiKey);
      setRawResponse(JSON.stringify(result, null, 2));
    } catch (e: unknown) {
      setRawResponse(`ERROR: ${String((e as Error).message)}`);
    }
    setSending(false);
  };

  const saveLabel = {
    idle:   "💾 Save to disk",
    saving: "⏳ Saving…",
    saved:  "✓ Saved",
    error:  "✗ Save failed",
  }[saveStatus];

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
        🛠 Dev mode only — this tab is stripped from production builds.
      </div>

      {/* System prompt editor */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-2 border-b pb-2">📝 System Prompt Editor</h3>
        <p className="text-xs text-gray-400 mb-2">
          Edits are held in-memory and used for all subsequent requests this session.
          "Save to disk" writes to <code>src/prompts/systemPrompt.ar.md</code> via the dev server.
        </p>
        <textarea
          dir="rtl"
          value={localPrompt}
          onChange={e => setLocalPrompt(e.target.value)}
          rows={16}
          className="w-full border rounded-lg px-3 py-2 text-sm arabic-text outline-none
                     focus:border-[#1c2b4a] resize-y font-mono"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSavePrompt}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors
              ${saveStatus === "saved"  ? "bg-green-100 text-green-700 border-green-300" : ""}
              ${saveStatus === "error"  ? "bg-red-100 text-red-600 border-red-300"       : ""}
              ${saveStatus === "idle" || saveStatus === "saving" ? "bg-[#1c2b4a] text-white border-[#1c2b4a]" : ""}`}
          >
            {saveLabel}
          </button>
          <button
            onClick={() => setLocalPrompt(getSystemPrompt())}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 hover:border-gray-500"
          >
            ↺ Reset to file
          </button>
        </div>
      </div>

      {/* Single-chunk test runner */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-2 border-b pb-2">🧪 Single-Chunk Test Runner</h3>
        <textarea
          dir="rtl"
          value={testChunk}
          onChange={e => setTestChunk(e.target.value)}
          rows={4}
          placeholder="أدخل مقطعاً نصياً للاختبار السريع…"
          className="w-full border rounded-lg px-3 py-2 arabic-text outline-none
                     focus:border-[#1c2b4a] resize-y mb-2"
        />
        <button
          onClick={handleTestRun}
          disabled={!testChunk.trim() || !apiKey || sending}
          className="bg-[#1c2b4a] text-white rounded-lg px-4 py-2 text-sm font-semibold
                     disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2d3f6b] transition-colors"
        >
          {sending ? "⏳ Running…" : "▶ Run Test"}
        </button>
      </div>

      {/* Raw request/response inspector */}
      {(rawRequest || rawResponse) && (
        <div className="rounded-xl bg-white p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-gray-800 border-b pb-2">🔍 Request / Response Inspector</h3>
          {rawRequest && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1">REQUEST BODY</p>
              <pre className="text-xs bg-gray-50 border rounded-lg p-3 overflow-x-auto max-h-60 whitespace-pre-wrap">
                {rawRequest}
              </pre>
            </div>
          )}
          {rawResponse && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1">RESPONSE</p>
              <pre className={`text-xs border rounded-lg p-3 overflow-x-auto max-h-60 whitespace-pre-wrap
                ${rawResponse.startsWith("ERROR") ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                {rawResponse}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/App.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { AppProvider, useAppState, useAppDispatch, type AppTab } from "./context/AppContext";
import { ConfigTab }     from "./components/tabs/ConfigTab";
import { InputTab }      from "./components/tabs/InputTab";
import { OutputTab }     from "./components/tabs/OutputTab";
import { PlaygroundTab } from "./components/tabs/PlaygroundTab";

const IS_DEV = import.meta.env.DEV;

const TABS: Array<{ id: AppTab; label: string; devOnly?: boolean }> = [
  { id: "config",     label: "⚙ Config"     },
  { id: "input",      label: "✏ Input"      },
  { id: "output",     label: "📄 Output"     },
  { id: "playground", label: "🛠 Playground", devOnly: true },
];

function Shell() {
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const { activeTab, result } = state;

  const visibleTabs = TABS.filter(t => !t.devOnly || IS_DEV);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-[#1c2b4a] tracking-tight">
            Arabic Text Proofreader
          </h1>
          <p className="arabic-text text-lg text-gray-500 mt-1">مدقق النصوص العربية</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-3 py-1 font-medium">
              Powered by Cohere · command-r7b-arabic
            </span>
            {IS_DEV && (
              <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-1 font-bold">
                DEV
              </span>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex bg-white rounded-t-xl shadow-sm border-b border-gray-100 overflow-hidden mb-0">
          {visibleTabs.map(tab => {
            const active = activeTab === tab.id;
            const hasResult = tab.id === "output" && result && result.clean.length + result.flagged.length > 0;
            return (
              <button
                key={tab.id}
                onClick={() => dispatch({ type: "SET_TAB", tab: tab.id })}
                className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors relative
                  ${active
                    ? "border-[#1c2b4a] text-[#1c2b4a]"
                    : "border-transparent text-gray-400 hover:text-gray-600"}`}
              >
                {tab.label}
                {hasResult && !active && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="bg-gray-100 rounded-b-xl pt-4">
          {activeTab === "config"     && <ConfigTab />}
          {activeTab === "input"      && <InputTab />}
          {activeTab === "output"     && <OutputTab />}
          {activeTab === "playground" && IS_DEV && <PlaygroundTab />}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// DEV SERVER (Express — double duty: dev write-back + future production proxy)
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// FILE: server/index.cjs
// NOTE: .cjs extension because the project root uses "type": "module" but this
//       server runs directly with Node, not through Vite's ESM pipeline.
//       Rename to server/index.mjs and use import/export if you prefer ESM.
// ─────────────────────────────────────────────────────────────────────────────
/*
"use strict";

const express = require("express");
const cors    = require("cors");
const fs      = require("fs");
const path    = require("path");

const PORT           = process.env.DEV_SERVER_PORT || 3001;
const PROMPT_FILE    = path.resolve(__dirname, "../src/prompts/systemPrompt.ar.md");

const app = express();
app.use(cors({ origin: "http://localhost:5173" })); // Vite default port
app.use(express.json({ limit: "1mb" }));

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ── Save system prompt to disk ────────────────────────────────────────────────
// Used by the Playground tab's "Save to disk" button (Option B write-back).
// Dev only — this route must never exist in a production deployment.
app.post("/api/save-prompt", (req, res) => {
  const { content } = req.body;
  if (typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({ error: "content must be a non-empty string" });
  }
  try {
    fs.writeFileSync(PROMPT_FILE, content, "utf8");
    console.log(`[dev-server] Wrote prompt to ${PROMPT_FILE} (${content.length} chars)`);
    res.json({ ok: true, path: PROMPT_FILE, chars: content.length });
  } catch (err) {
    console.error("[dev-server] Write error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// ── PRODUCTION PROXY STUB ─────────────────────────────────────────────────────
// This block is intentionally empty. When you're ready for real production
// deployment, add your Cohere API key here (server-side, never in the client)
// and forward requests from /api/cohere → api.cohere.com, enforcing your own
// rate limits, plan-tier checks, and usage counting server-side.
//
// The VITE_COHERE_API_KEY env var should be removed from the client .env and
// moved to server/.env at that point. The client switches from calling
// api.cohere.com directly to calling /api/cohere instead.
//
// app.post("/api/cohere", async (req, res) => {
//   const COHERE_KEY = process.env.COHERE_API_KEY; // server-side only
//   // ... forward, enforce limits, return response
// });

app.listen(PORT, () => {
  console.log(`[dev-server] Running on http://localhost:${PORT}`);
  console.log(`[dev-server] Prompt file: ${PROMPT_FILE}`);
  console.log(`[dev-server] /api/save-prompt — write-back enabled`);
  console.log(`[dev-server] /api/cohere      — stub, not yet implemented`);
});
*/


// ═════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT SOURCE FILE
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/prompts/systemPrompt.ar.md
// Changelog header format: YYYY-MM-DD: one-line description of change and why.
// ─────────────────────────────────────────────────────────────────────────────
/*
<!--
CHANGELOG
2026-06-20: Initial port — 8-rule battle-tested prompt with minimal-pair examples.
            Source: Cohere Playground testing session (see handoff report).
-->

أنت مدقق لغوي عربي خبير. ستتلقى النص المراد تدقيقه على شكل مقاطع متتالية، مقطعاً واحداً في كل رسالة. مهمتك في كل رسالة هي تدقيق المقطع الحالي فقط بحثاً عن جميع أنواع الأخطاء اللغوية (نحوية، إملائية، أو أي خطأ لغوي آخر).

أخرج النتائج بصيغة JSON بالشكل التالي حصراً:
{ "التوصيات": [ { "العبارة": "...", "الخطأ": "...", "التصحيح": "..." } ] }

قواعد صارمة يجب الالتزام بها دون استثناء:

### قاعدة 1: تطابق نطاق العبارة والتصحيح
"العبارة" يجب أن تكون نسخة طبق الأصل من النص الأصلي، بنفس الكلمات المحيطة بالخطأ، وليس كلمة واحدة فقط. "التصحيح" يجب أن يكون العبارة المصححة كاملة، بنفس نطاق وسياق "العبارة" تماماً — لا أقل ولا أكثر.

✅ مثال صحيح:
{ "العبارة": "في السَّكَنِ الجامعِيٌّ،", "الخطأ": "التشكيل على كلمة \"الجامعِيٌّ\" غير صحيح.", "التصحيح": "في السَّكَنِ الجامعيّ،" }

❌ مثال خاطئ — نفس الحالة:
{ "العبارة": "في السَّكَنِ الجامعِيٌّ،", "الخطأ": "التشكيل على كلمة \"الجامعِيٌّ\" غير صحيح.", "التصحيح": "الجامعيّ،" }

❌ مثال خاطئ آخر — حالة مختلفة:
{ "العبارة": "كلمة تدل على \"جمع المال وعدمُ إنفاقه\":", "الخطأ": "خطأ في تشكيل \"عدمُ\".", "التصحيح": "عدمِ" }

### قاعدة 2: التصحيح يجب أن يطبّق فعلياً ما يصفه "الخطأ"
لا تكتب وصف خطأ في حقل "الخطأ" دون تطبيق هذا التصحيح فعلياً وبالكامل في حقل "التصحيح".

✅ مثال صحيح:
{ "العبارة": "ورأيتُ أحمدَ.", "الخطأ": "حرف العطف \"و\" غير مناسب لبداية الجملة.", "التصحيح": "رأيتُ أحمدَ." }

❌ مثال خاطئ:
{ "العبارة": "أَمِّي طبيبة.", "الخطأ": "حرف العطف \"و\" غير مناسب لربط الجملة؛ الصحيح \"أمّي طبيبة.\"", "التصحيح": "أَمِّي طبيبة." }

### قاعدة 3: إذا تطابقت العبارة والتصحيح تماماً، احذف العنصر بالكامل
إذا كان حقل "التصحيح" مطابقاً حرفياً لحقل "العبارة" دون أي تغيير، فهذا يعني عدم وجود خطأ فعلي. لا تُدرج هذا العنصر في القائمة إطلاقاً.

✅ القرار الداخلي الصحيح: لا يُكتب أي عنصر لعبارة صحيحة — لا في "التوصيات" ولا كتعليق.

❌ مثال خاطئ:
{ "العبارة": "الباعة كانوا لطفاء جداً", "الخطأ": "لا يوجد خطأ فعلي.", "التصحيح": "الباعة كانوا لطفاء جداً" }

### قاعدة 4: نظّف النطاق بالكامل، وليس فقط الخطأ الذي بدأت بوصفه
بعد كتابة "التصحيح"، راجع "العبارة" الأصلية كاملة وتأكد أن "التصحيح" خالٍ من أي خطأ آخر ضمن النطاق نفسه.

✅ مثال صحيح:
{ "العبارة": "هاذا الجامعت كبير وجميل،", "الخطأ": "خطأ إملائي في \"هاذا\" وخطأ إملائي آخر في \"الجامعت\".", "التصحيح": "هذه الجامعة كبيرة وجميلة." }

❌ مثال خاطئ:
{ "العبارة": "هاذا الجامعت كبير وجميل،", "الخطأ": "الكلمة \"هاذا\" غير صحيحة.", "التصحيح": "هذا الجامعت كبير وجميل،" }

### قاعدة 5: لا تُجرِ تغييرات غير مذكورة في وصف الخطأ
لا تُغيّر علامات ترقيم أو أدوات تعريف أو أي عنصر آخر في "التصحيح" دون أن يكون ذلك مذكوراً صراحة في "الخطأ".

✅ مثال صحيح:
{ "العبارة": "أسمي أحمد، وأنا من بريطانيا.", "الخطأ": "خطأ إملائي في \"أسمي\"؛ الصحيح \"اسمي\".", "التصحيح": "اسمي أحمد، وأنا من بريطانيا." }

❌ مثال خاطئ:
{ "العبارة": "أسمي أحمد، وأنا من بريطانيا.", "الخطأ": "خطأ إملائي في \"أسمي\".", "التصحيح": "اسمي أحمد وأنا بريطاني." }

### قاعدة 6: القرار الصامت
قرر التصحيح النهائي بنفسك بصمت قبل الكتابة. لا تُظهر تفكيرك، ولا تطرح أكثر من خيار واحد.

✅ مثال صحيح:
{ "العبارة": "هذا الجامعة كبير", "الخطأ": "استخدام \"هذا\" مع اسم مؤنث.", "التصحيح": "هذه الجامعة كبيرة" }

❌ مثال خاطئ:
{ "العبارة": "الباعة كانوا لطفاء", "الخطأ": "... في الواقع، دعنا نتحقق ... نتجاهل هذا.", "التصحيح": "الباعة كانوا لطفاء" }

### قاعدة 7: معالجة التشكيل (الحركات)
- احفظ التشكيل الأصلي في "العبارة" بالضبط.
- في "التصحيح"، عدّل التشكيل فقط على موضع الخطأ.
- لا تحذف أو تضف تشكيلاً على كلمات أخرى.

✅ مثال صحيح:
{ "العبارة": "في السَّكَنِ الجامعِيٌّ، كانت الحياةُ ممتعة.", "الخطأ": "التشكيل على \"الجامعِيٌّ\" غير صحيح.", "التصحيح": "في السَّكَنِ الجامعيّ، كانت الحياةُ ممتعة." }

❌ مثال خاطئ:
{ "العبارة": "في السَّكَنِ الجامعِيٌّ، كانت الحياةُ ممتعة.", "الخطأ": "التشكيل على \"الجامعِيٌّ\" غير صحيح.", "التصحيح": "في السكن الجامعي، كانت الحياة ممتعة." }

### قاعدة 8: حالة عدم وجود أخطاء
إذا لم تجد أي أخطاء في المقطع الحالي بأكمله، أعد: { "التوصيات": [] }

### معالجة المقاطع المتعددة:
- تعامل مع كل مقطع بشكل مستقل تماماً عن المقاطع السابقة.
- لا تُعِد ذكر خطأ سبق أن ذكرته في رد على مقطع سابق.
- ركّز فقط على المقطع المُحدَّد بين الفاصلين في الرسالة الحالية.
*/


// ═════════════════════════════════════════════════════════════════════════════
// PHASE 5 — INVESTIGATION TRACK (stubs for open questions from handoff)
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/lib/schemaMode.ts
// Stub for Phase 5 item 17: validate Arabic-keyed JSON Schema mode vs real API.
// The schema that partially worked in the Playground UI is preserved here.
// Wire it into cohereClient.ts once confirmed against the real API.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Arabic-keyed JSON Schema that was accepted by the Cohere Playground UI
 * (omitting top-level "type" keys on container nodes, per UI quirk).
 *
 * OPEN QUESTION: Does the real /v2/chat API require the fuller wrapper shape
 * even when the Playground field doesn't enforce it?
 * Test with: response_format: { type: "json_object", schema: ARABIC_SCHEMA }
 */
export const ARABIC_SCHEMA = {
  properties: {
    التوصيات: {
      items: {
        properties: {
          العبارة:  { type: "string" },
          الخطأ:   { type: "string" },
          التصحيح: { type: "string" },
        },
        required: ["العبارة", "الخطأ", "التصحيح"],
      },
    },
  },
  required: ["التوصيات"],
};

// To test, add `schema: ARABIC_SCHEMA` inside `response_format` in cohereClient.ts:
// response_format: { type: "json_object", schema: ARABIC_SCHEMA }
// and observe whether output quality holds vs JSON-mode-no-schema.


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/lib/temperatureTest.ts
// Stub for Phase 5 item 16: re-verify the 0.4 temperature floor.
// Run this from the Playground tab's test runner with the temperatures below.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Temperature values to re-test empirically before locking production defaults.
 * The 0.4 floor was observed across a small number of Playground runs —
 * confirm it's a real model constraint rather than test-run artifact.
 *
 * Suggested test procedure:
 *   1. Use the same 2-3 representative Arabic text samples each time.
 *   2. Run each temperature 3 times (seed varies: 42, 43, 44).
 *   3. Grade output on: valid JSON, correct field structure, error accuracy.
 *   4. Update TESTING_DEFAULTS.temperature if 0.1 or 0.2 prove stable.
 */
export const TEMPERATURE_TEST_VALUES = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5] as const;
