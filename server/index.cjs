"use strict";

const express = require("express");
const cors    = require("cors");
const dotenv  = require("dotenv");
const fs      = require("fs");
const path    = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

const PORT           = process.env.DEV_SERVER_PORT || 3001;
const PROMPT_FILE    = path.resolve(__dirname, "../src/prompts/systemPrompt.ar.md");
const COHERE_CHAT_V2 = "https://api.cohere.com/v2/chat";
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://cohere-proofreader.test",
];

const app = express();
app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin not allowed: ${origin}`));
  },
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

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

app.post("/api/cohere", async (req, res) => {
  const { apiKey: clientSuppliedKey, ...cohereBody } = req.body || {};
  const effectiveKey = process.env.COHERE_API_KEY || clientSuppliedKey;

  if (!effectiveKey) {
    return res.status(400).json({
      error: "No Cohere API key available. Set COHERE_API_KEY on the server or supply apiKey in the request body for dev-only testing.",
    });
  }

  let upstreamResp;
  try {
    upstreamResp = await fetch(COHERE_CHAT_V2, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${effectiveKey}`,
      },
      body: JSON.stringify(cohereBody),
    });
  } catch (err) {
    const detail = err && typeof err === "object" && "message" in err ? String(err.message) : String(err);
    console.error("[dev-server] Upstream fetch to Cohere failed:", detail);
    return res.status(502).json({
      error: "Failed to reach Cohere upstream API.",
      detail,
    });
  }

  const retryAfter = upstreamResp.headers.get("retry-after");
  if (retryAfter) {
    res.set("retry-after", retryAfter);
  }

  const rawText = await upstreamResp.text();
  try {
    const payload = JSON.parse(rawText);
    return res.status(upstreamResp.status).json(payload);
  } catch {
    return res.status(upstreamResp.status).json({
      error: "Upstream returned non-JSON response.",
      raw: rawText.slice(0, 2000),
    });
  }
});

app.listen(PORT, () => {
  console.log(`[dev-server] Running on http://localhost:${PORT}`);
  console.log(`[dev-server] Prompt file: ${PROMPT_FILE}`);
  console.log(`[dev-server] /api/save-prompt — write-back enabled`);
  console.log(`[dev-server] /api/cohere      — proxy enabled`);
});
