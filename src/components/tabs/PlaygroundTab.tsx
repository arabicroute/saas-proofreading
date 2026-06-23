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
import { CLS, IDS } from "../../lib/uiSelectors";

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
      const resp = await fetch("/api/save-prompt", {
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
    <div id={IDS.tabPanel("playground")} className="space-y-4">
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
        🛠 Dev mode only — this tab is stripped from production builds.
      </div>

      {/* System prompt editor */}
      <div id={IDS.settingsCard("playground-prompt")} className={CLS.settingsCard}>
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
          className={`${CLS.fieldTextarea} arabic-text resize-y font-mono`}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSavePrompt}
            className={`${CLS.actionSecondary} ${
              saveStatus === "saved"
                ? "bg-green-100 text-green-700"
                : saveStatus === "error"
                  ? "bg-red-100 text-red-600"
                  : ""
            }`}
            type="button"
          >
            {saveLabel}
          </button>
          <button
            onClick={() => setLocalPrompt(getSystemPrompt())}
            className={CLS.actionSecondary}
            type="button"
          >
            ↺ Reset to file
          </button>
        </div>
      </div>

      {/* Single-chunk test runner */}
      <div id={IDS.settingsCard("playground-runner")} className={CLS.settingsCard}>
        <h3 className="font-bold text-gray-800 mb-2 border-b pb-2">🧪 Single-Chunk Test Runner</h3>
        <textarea
          dir="rtl"
          value={testChunk}
          onChange={e => setTestChunk(e.target.value)}
          rows={4}
          placeholder="أدخل مقطعاً نصياً للاختبار السريع…"
          className={`${CLS.fieldTextarea} arabic-text mb-2 resize-y`}
        />
        <button
          id="action-playground-run"
          onClick={handleTestRun}
          disabled={!testChunk.trim() || !apiKey || sending}
          className={`${CLS.actionPrimary} w-auto px-4 py-2 text-sm`}
          type="button"
        >
          {sending ? "⏳ Running…" : "▶ Run Test"}
        </button>
      </div>

      {/* Raw request/response inspector */}
      {(rawRequest || rawResponse) && (
        <div id={IDS.settingsCard("playground-inspector")} className={`${CLS.settingsCard} space-y-3`}>
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
