// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  API PROXY TRACK — UPDATED / NEW FILES                                       ║
// ║  Task source: Handoff - API Proxy Track.md                                   ║
// ╚══════════════════════════════════════════════════════════════════════════════╝


// ─────────────────────────────────────────────────────────────────────────────
// FILE: server/index.cjs   (UPDATED — Task 1)
// ─────────────────────────────────────────────────────────────────────────────
/*
"use strict";

const express = require("express");
const cors    = require("cors");
const fs      = require("fs");
const path    = require("path");

const PORT           = process.env.DEV_SERVER_PORT || 3001;
const PROMPT_FILE    = path.resolve(__dirname, "../src/prompts/systemPrompt.ar.md");
const COHERE_CHAT_V2 = "https://api.cohere.com/v2/chat";

// Allowed local origins. Vite dev server + Laragon-served local host.
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://cohere-proofreader.test",
];

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: "1mb" }));

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ── Save system prompt to disk ────────────────────────────────────────────────
// UNCHANGED from prior pass — do not touch per handoff guardrails.
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

// ── Cohere proxy ───────────────────────────────────────────────────────────────
// POST /api/cohere
//
// Request contract:
//   body = the assembled Cohere chat request payload (model, messages,
//          response_format, temperature, seed, max_tokens, thinking, ...)
//          PLUS an optional top-level "apiKey" field.
//
// Key resolution order:
//   1. process.env.COHERE_API_KEY (server-side, preferred)
//   2. req.body.apiKey            (dev-only client-supplied fallback)
//
// The "apiKey" field is stripped from the body before forwarding to Cohere
// and is never written to any log line, including error logs.
//
// Behavior:
//   - Forwards the request to Cohere's /v2/chat endpoint.
//   - Preserves Cohere's HTTP status code on the response to the client
//     wherever possible (401, 403, 429, 5xx, etc. pass through as-is).
//   - Forwards the "retry-after" header on 429 responses.
//   - Returns the Cohere JSON payload unchanged on success.
app.post("/api/cohere", async (req, res) => {
  const { apiKey: clientSuppliedKey, ...cohereBody } = req.body || {};

  const serverKey = process.env.COHERE_API_KEY;
  const effectiveKey = serverKey || clientSuppliedKey;

  if (!effectiveKey) {
    return res.status(400).json({
      error: "No Cohere API key available. Set COHERE_API_KEY on the server, " +
             "or supply 'apiKey' in the request body for dev-only testing.",
    });
  }

  let upstreamResp;
  try {
    upstreamResp = await fetch(COHERE_CHAT_V2, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Accept":        "application/json",
        "Authorization": `Bearer ${effectiveKey}`,
      },
      body: JSON.stringify(cohereBody),
    });
  } catch (err) {
    // Network-level failure reaching Cohere itself (not a local proxy issue —
    // the request DID leave this server). Never log err in a way that could
    // include the key; err here is a fetch/network error object only.
    console.error("[dev-server] Upstream fetch to Cohere failed:", err.message || err);
    return res.status(502).json({
      error: "Failed to reach Cohere upstream API.",
      detail: String(err.message || err),
    });
  }

  // Forward retry-after header on 429s so the client's existing rate-limit
  // handling (isRateLimit / retryAfterSecs) keeps working unchanged.
  const retryAfter = upstreamResp.headers.get("retry-after");
  if (retryAfter) res.set("retry-after", retryAfter);

  let payload;
  const rawText = await upstreamResp.text();
  try {
    payload = JSON.parse(rawText);
  } catch {
    // Upstream returned non-JSON (rare, but pass it through transparently
    // rather than masking it as a generic proxy error).
    return res.status(upstreamResp.status).json({
      error: "Upstream returned non-JSON response.",
      raw: rawText.slice(0, 2000),
    });
  }

  // Preserve Cohere's status code on the response to the client.
  res.status(upstreamResp.status).json(payload);
});

// ── Boot ───────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[dev-server] Running on http://localhost:${PORT}`);
  console.log(`[dev-server] Prompt file: ${PROMPT_FILE}`);
  console.log(`[dev-server] /api/save-prompt — write-back enabled`);
  console.log(`[dev-server] /api/cohere      — proxy enabled (key source: ${
    process.env.COHERE_API_KEY ? "server env" : "client-supplied fallback only"
  })`);
});
*/


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/types/cohere.ts   (UPDATED — Task 2/3)
// Added: ProxyRequestBody type extending CohereChatRequest with optional apiKey.
// Nothing else in this file changes.
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

// NEW: what the client actually sends to the local /api/cohere proxy.
// Identical to CohereChatRequest, plus an optional dev-only apiKey field
// that the proxy strips before forwarding upstream.
export interface ProxyRequestBody extends CohereChatRequest {
  apiKey?: string;
}

export interface CohereChatResponse {
  message?: {
    content?: Array<{ type: string; text: string }>;
  };
  // Older V2 response shape fallback
  text?: string;
  finish_reason?: string;
}

// NEW: shape returned by the proxy on a handled (non-2xx) error,
// distinct from a raw Cohere error payload, so the client can tell
// "my own proxy rejected this" apart from "Cohere rejected this".
export interface ProxyErrorPayload {
  error: string;
  detail?: string;
  raw?: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/lib/cohereClient.ts   (UPDATED — Task 2/3/4)
//
// Changes from prior version:
//   - COHERE_CHAT_V2 constant removed (no more direct browser → Cohere calls)
//   - New: resolveApiBase() reads VITE_API_BASE_URL, falls back to relative /api
//   - New: PROXY_ENDPOINT = `${apiBase}/cohere`
//   - callCohere() now POSTs to the proxy, with apiKey included in the body
//     only as a dev fallback (server prefers its own env key if configured)
//   - testCohereConnection() now hits the SAME proxy path, and distinguishes
//     "local proxy unreachable" from "upstream Cohere failure" in its result
//   - Parsing logic (extractText, safeParseChunkResponse) is UNCHANGED —
//     preserved per handoff instruction. See note below re: a pre-existing
//     edge case in extractText that was NOT touched in this pass.
// ─────────────────────────────────────────────────────────────────────────────

import type { CohereChatRequest, CohereChatResponse, CohereMessage, ProxyRequestBody } from "../types/cohere";
import type { ChunkResponse, Recommendation } from "../types/recommendation";
import type { FeatureConfig } from "../types/featureConfig";

// ── API base resolution (Task 3) ──────────────────────────────────────────────
// Vite dev mode:        VITE_API_BASE_URL unset  → relative "/api" (proxied by vite.config.ts)
// Laragon-served mode:  VITE_API_BASE_URL set     → e.g. "http://localhost:3001/api"
function resolveApiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) {
    // Allow either "http://localhost:3001" or "http://localhost:3001/api" —
    // normalize so we don't end up with a doubled or missing /api segment.
    return configured.endsWith("/api") ? configured : `${configured.replace(/\/$/, "")}/api`;
  }
  return "/api";
}

const PROXY_ENDPOINT = `${resolveApiBase()}/cohere`;

// NOTE: This is a pre-existing edge case, not introduced or fixed in this pass
// (handoff instructs preserving current parsing unless a clear bug is found —
// this is noted in the follow-up report rather than silently patched here).
// If a future Cohere response shape doesn't include a "text"-type content
// block, extractText() returns "" indistinguishably from a genuine empty
// model response.
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

/**
 * Builds the request body sent to the LOCAL proxy (not directly to Cohere).
 * apiKey is included only as a dev-mode fallback — if the server has
 * COHERE_API_KEY configured, it ignores this field entirely.
 */
function buildProxyBody(messages: CohereMessage[], cfg: FeatureConfig, apiKey: string): ProxyRequestBody {
  const body: CohereChatRequest = {
    model: cfg.modelId,
    messages,
    response_format: { type: "json_object" },
    temperature: cfg.temperature,
    seed: cfg.seed,
    max_tokens: cfg.maxOutputTokens,
    ...(cfg.thinkingDisabled ? { thinking: { type: "disabled" } } : {}),
  };
  return { ...body, apiKey };
}

export async function callCohere(
  messages: CohereMessage[],
  cfg: FeatureConfig,
  apiKey: string
): Promise<ChunkResponse> {
  const body = buildProxyBody(messages, cfg, apiKey);

  let resp: Response;
  try {
    resp = await fetch(PROXY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    // Local proxy itself unreachable (Express not running, wrong port,
    // CORS misconfiguration, etc.) — distinct from an upstream Cohere error.
    throw new Error(
      `Could not reach local API proxy at ${PROXY_ENDPOINT}. ` +
      `Is the dev server running? (${String((networkErr as Error).message)})`
    );
  }

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
      const e = await resp.json() as { message?: string; error?: string; detail?: string };
      detail = e.message ?? e.error ?? e.detail ?? "";
    } catch { /* ignore */ }
    throw new Error(`Cohere API error ${resp.status}${detail ? ": " + detail : ""}`);
  }

  const data = await resp.json() as CohereChatResponse;
  const raw  = extractText(data);
  return safeParseChunkResponse(raw);
}

/**
 * Tests the connection through the SAME proxy path the app actually uses
 * (Task 4) — so a passing test means the real request path works, not just
 * that Cohere itself is reachable from somewhere.
 *
 * Distinguishes four failure stages:
 *   1. "Local Proxy"   — /api/cohere itself unreachable (network-level)
 *   2. "Upstream Auth" — proxy reached Cohere, but Cohere rejected the key
 *   3. "Rate Limit"    — proxy reached Cohere, 429 returned
 *   4. "Response Shape"— HTTP 200 but malformed/empty payload
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
    resp = await fetch(PROXY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: "Reply with PONG and nothing else." },
          { role: "user",   content: "PING"                              },
        ],
        response_format: { type: "json_object" },
        max_tokens: 16,
        temperature: 0,
        apiKey,
      } satisfies Partial<ProxyRequestBody>),
    });
  } catch (e) {
    return {
      ok: false, status: null, stage: "Local Proxy",
      detail: `Could not reach the local API proxy at ${PROXY_ENDPOINT}.\n\n` +
              `Check that the Express dev server is running, and that VITE_API_BASE_URL ` +
              `is set correctly if you're testing the Laragon-served build.\n\n${String(e)}`,
    };
  }

  // Proxy-level failure: it couldn't even reach Cohere (502 from our own /api/cohere)
  if (resp.status === 502) {
    const body = await resp.json().catch(() => ({} as { detail?: string }));
    return {
      ok: false, status: 502, stage: "Local Proxy",
      detail: `The local proxy reached out but could not connect to Cohere's upstream API.\n\n${body.detail ?? ""}`,
    };
  }

  if (resp.status === 400) {
    const body = await resp.json().catch(() => ({} as { error?: string }));
    return {
      ok: false, status: 400, stage: "Local Proxy",
      detail: body.error ?? "Proxy rejected the request (400). No API key available server-side or client-side.",
    };
  }

  if (resp.status === 401) return { ok: false, status: 401, stage: "Upstream Auth",  detail: "Cohere rejected the API key (401). Check that your key is complete and has no extra spaces." };
  if (resp.status === 403) return { ok: false, status: 403, stage: "Upstream Auth",  detail: "Cohere denied access (403). Verify your key has the correct permissions." };
  if (resp.status === 429) return { ok: false, status: 429, stage: "Rate Limit",     detail: "Cohere rate limit hit (429). Wait and try again." };

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    return { ok: false, status: resp.status, stage: "Upstream Error", detail: `HTTP ${resp.status}\n\n${body}` };
  }

  const data = await resp.json() as CohereChatResponse;
  const text = extractText(data).trim();

  if (!text) {
    return { ok: false, status: resp.status, stage: "Response Shape", detail: "HTTP 200 but no text in response body (via proxy)." };
  }

  return { ok: true, status: 200, stage: "Connected", detail: `Model replied via proxy: "${text.slice(0, 200)}"` };
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/shared/ConnectionPanel.tsx   (UPDATED — Task 4)
//
// Changes: stage label now reflects the four-way distinction from the proxy-
// aware testCohereConnection() (Local Proxy / Upstream Auth / Rate Limit /
// Response Shape / Connected). Visual structure otherwise unchanged.
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

  // Stage-specific hint shown above the debug pane, so a failure's category
  // is legible at a glance before expanding the raw detail text.
  const stageHint: Record<string, string> = {
    "Local Proxy":    "The request never reached Cohere — check your local dev/proxy server.",
    "Upstream Auth":  "The proxy reached Cohere, but the API key was rejected.",
    "Rate Limit":     "The proxy reached Cohere, but the request was rate-limited.",
    "Response Shape": "Cohere responded with HTTP 200 but the payload was unusable.",
    "Upstream Error": "Cohere returned an unexpected error status.",
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm mb-4">
      <h3 className="font-bold text-navy-900 mb-4 border-b pb-2">🔑 Cohere Connection (via local proxy)</h3>
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
          {!result.ok && stageHint[result.stage] && (
            <p className="text-xs text-red-500 mb-2">{stageHint[result.stage]}</p>
          )}
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
// FILE: vite.config.ts   (UNCHANGED — Task 3 note)
//
// No changes needed here. The existing mode-aware config you shared already
// does what Task 3 needs on the Vite-dev side:
//   - server.proxy["/api"] → http://localhost:${devServerPort}
// VITE_API_BASE_URL is consumed entirely client-side in cohereClient.ts via
// import.meta.env.VITE_API_BASE_URL, so no vite.config.ts change was required
// to support the Laragon path — it's a build-time env var, not a dev-proxy
// concern. Reproduced below for reference only, byte-identical to what you sent.
// ─────────────────────────────────────────────────────────────────────────────
/*
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devServerPort = env.DEV_SERVER_PORT || "3001";
  const isLaragonBuild = mode === "laragon";

  return {
    base: isLaragonBuild ? "/dist/" : "/",
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: `http://localhost:${devServerPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
*/


// ─────────────────────────────────────────────────────────────────────────────
// FILE: .env.example   (UPDATED — Task 3)
// ─────────────────────────────────────────────────────────────────────────────
/*
# ── Client-side (Vite, exposed to the browser bundle) ─────────────────────────

# Dev-only fallback API key. Sent to the local proxy as a request-body field
# ONLY when the proxy has no server-side COHERE_API_KEY configured.
# Leave this blank once you've set COHERE_API_KEY on the server — at that
# point this value is never used.
VITE_COHERE_API_KEY=your_cohere_api_key_here

# Base URL for the local API proxy.
#   - Leave EMPTY for Vite dev mode: requests go to relative "/api",
#     which vite.config.ts proxies to the Express dev server.
#   - SET this for Laragon-served mode, since Apache does not proxy /api/*
#     to Express automatically:
#       VITE_API_BASE_URL=http://localhost:3001
VITE_API_BASE_URL=

# ── Server-side (Express, server/index.cjs — never sent to the browser) ───────

# Preferred: real Cohere key, held server-side only. When set, this is always
# used over any client-supplied apiKey field, and the client no longer needs
# VITE_COHERE_API_KEY at all.
COHERE_API_KEY=

# Dev write-back / proxy server port.
DEV_SERVER_PORT=3001
*/
