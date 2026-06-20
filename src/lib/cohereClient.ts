import type { CohereChatResponse, CohereMessage, ProxyRequestBody } from "../types/cohere";
import type { ChunkResponse, Recommendation } from "../types/recommendation";
import type { FeatureConfig } from "../types/featureConfig";

const CONNECTION_TEST_TIMEOUT_MS = 15_000;

function resolveApiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!configured) {
    return "/api";
  }

  return configured.endsWith("/api")
    ? configured
    : `${configured.replace(/\/$/, "")}/api`;
}

const PROXY_ENDPOINT = `${resolveApiBase()}/cohere`;

export interface ConnectionDebugContext {
  configuredApiBase: string;
  resolvedApiBase: string;
  proxyEndpoint: string;
  clientKeyPresent: boolean;
  warnings: string[];
}

export function getConnectionDebugContext(apiKey: string): ConnectionDebugContext {
  const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";
  const resolvedApiBase = resolveApiBase();
  const warnings: string[] = [];

  if (configuredApiBase.includes("`")) {
    warnings.push("`VITE_API_BASE_URL` contains backticks. Remove them from the .env value.");
  }

  if (/cohere-proofreader\.test\/?$/i.test(configuredApiBase)) {
    warnings.push("`VITE_API_BASE_URL` points to the app host. In Laragon mode it should usually point to the Express proxy, e.g. `http://localhost:3001`.");
  }

  if (!apiKey.trim()) {
    warnings.push("No client-side fallback key is currently entered in the UI. That is fine only if `COHERE_API_KEY` is configured server-side.");
  }

  return {
    configuredApiBase,
    resolvedApiBase,
    proxyEndpoint: PROXY_ENDPOINT,
    clientKeyPresent: !!apiKey.trim(),
    warnings,
  };
}

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
  const body: ProxyRequestBody = {
    model: cfg.modelId,
    messages,
    response_format: { type: "json_object" },
    temperature: cfg.temperature,
    seed: cfg.seed,
    max_tokens: cfg.maxOutputTokens,
    ...(cfg.thinkingDisabled ? { thinking: { type: "disabled" } } : {}),
    apiKey,
  };

  let resp: Response;
  try {
    resp = await fetch(PROXY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new Error(
      `Could not reach local API proxy at ${PROXY_ENDPOINT}. Is the Express server running? (${String((networkErr as Error).message)})`
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

type DebugLogger = (message: string) => void;

export async function testCohereConnection(
  apiKey: string,
  cfg: Pick<FeatureConfig, "modelId" | "temperature" | "seed" | "thinkingDisabled">,
  onDebug?: DebugLogger
): Promise<ConnectionTestResult> {
  let resp: Response;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort("timeout"), CONNECTION_TEST_TIMEOUT_MS);
  const debug = (message: string) => onDebug?.(message);

  const ctx = getConnectionDebugContext(apiKey);
  debug(`Configured VITE_API_BASE_URL: ${ctx.configuredApiBase || "(empty)"}`);
  debug(`Resolved API base: ${ctx.resolvedApiBase}`);
  debug(`Proxy endpoint: ${ctx.proxyEndpoint}`);
  debug(`Client fallback key present: ${ctx.clientKeyPresent ? "yes" : "no"}`);
  if (ctx.warnings.length > 0) {
    for (const warning of ctx.warnings) {
      debug(`Warning: ${warning}`);
    }
  }
  debug(`Model: ${cfg.modelId}`);
  debug(`Temperature: ${cfg.temperature}`);
  debug(`Seed: ${cfg.seed}`);
  debug(`Thinking disabled: ${cfg.thinkingDisabled ? "yes" : "no"}`);
  debug(`Dispatching connection test request to proxy with model "${cfg.modelId}"...`);

  try {
    resp = await fetch(PROXY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: cfg.modelId,
        messages: [
          { role: "system", content: 'Reply with {"pong": true} and nothing else.' },
          { role: "user",   content: "PING"                              },
        ],
        response_format: { type: "json_object" },
        max_tokens: 16,
        temperature: cfg.temperature,
        seed: cfg.seed,
        ...(cfg.thinkingDisabled ? { thinking: { type: "disabled" } } : {}),
        apiKey,
      } satisfies Partial<ProxyRequestBody>),
    });
  } catch (e) {
    window.clearTimeout(timeoutId);
    const errorMessage = e instanceof Error ? e.message : String(e);
    const timedOut = e instanceof DOMException && e.name === "AbortError";
    debug(timedOut ? `Request timed out after ${CONNECTION_TEST_TIMEOUT_MS / 1000}s.` : `Fetch failed before receiving a response: ${errorMessage}`);
    return {
      ok: false, status: null, stage: "Local Proxy",
      detail: timedOut
        ? `Timed out while waiting for the local API proxy at ${PROXY_ENDPOINT}.\n\nCheck that VITE_API_BASE_URL points to the Express proxy and that the proxy server is responding.`
        : `Could not reach the local API proxy at ${PROXY_ENDPOINT}.\n\nCheck that the Express dev server is running, and that VITE_API_BASE_URL is set correctly for the Laragon-served build.\n\n${errorMessage}`,
    };
  }
  window.clearTimeout(timeoutId);

  debug(`Proxy responded with HTTP ${resp.status}.`);

  if (resp.status === 502) {
    const body = await resp.json().catch(() => ({} as { detail?: string }));
    debug(`Proxy could not reach Cohere upstream. Detail: ${body.detail ?? "(none)"}`);
    return {
      ok: false, status: 502, stage: "Local Proxy",
      detail: `The local proxy could not connect to Cohere's upstream API.\n\n${body.detail ?? ""}`,
    };
  }
  if (resp.status === 400) {
    const body = await resp.json().catch(() => ({} as { error?: string }));
    debug(`Proxy rejected the request before contacting Cohere. Detail: ${body.error ?? "(none)"}`);
    return {
      ok: false, status: 400, stage: "Local Proxy",
      detail: body.error ?? "Proxy rejected the request (400). No API key was available server-side or client-side.",
    };
  }
  if (resp.status === 401) debug("Cohere rejected the API key with HTTP 401.");
  if (resp.status === 401) return { ok: false, status: 401, stage: "Upstream Auth", detail: "Cohere rejected the API key (401). Check that your key is complete and has no extra spaces." };
  if (resp.status === 403) debug("Cohere denied access with HTTP 403.");
  if (resp.status === 403) return { ok: false, status: 403, stage: "Upstream Auth", detail: "Cohere denied access (403). Verify your key has the correct permissions." };
  if (resp.status === 429) debug("Cohere rate-limited the request with HTTP 429.");
  if (resp.status === 429) return { ok: false, status: 429, stage: "Rate Limit",     detail: "Rate limit hit (429). Wait and try again." };
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    debug(`Unexpected upstream error body: ${body.slice(0, 300) || "(empty)"}`);
    return { ok: false, status: resp.status, stage: "Upstream Error", detail: `HTTP ${resp.status}\n\n${body}` };
  }

  const data = await resp.json() as CohereChatResponse;
  const text = extractText(data).trim();
  debug(`Received successful JSON payload from proxy. Extracted text length: ${text.length}.`);

  if (!text) {
    debug("Response payload did not contain a usable text block.");
    return { ok: false, status: resp.status, stage: "Response Shape", detail: "HTTP 200 but no text in response body (via proxy)." };
  }

  debug(`Connection test succeeded. Sample reply: ${text.slice(0, 120)}`);
  return { ok: true, status: 200, stage: "Connected", detail: `Model replied via proxy: "${text.slice(0, 200)}"` };
}
