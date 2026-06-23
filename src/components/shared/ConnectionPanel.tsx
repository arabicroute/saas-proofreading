
// src/components/shared/ConnectionPanel.tsx
import { useState } from "react";
import {
  getConnectionDebugContext,
  testCohereConnection,
  type ConnectionTestResult,
} from "../../lib/cohereClient";
import { useAppState } from "../../context/AppContext";
import { CLS, IDS, DATA } from "../../lib/uiSelectors";

export function ConnectionPanel() {
  const { apiKey, cfg, ui } = useAppState();
  const [result,        setResult]        = useState<ConnectionTestResult | null>(null);
  const [testing,       setTesting]       = useState(false);
  const [showDebug,     setShowDebug]     = useState(false);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    setShowDebug(true);
    setDebugMessages([]);
    const r = await testCohereConnection(apiKey, cfg, message => {
      setDebugMessages(cur => [...cur, message]);
    });
    setResult(r);
    setTesting(false);
  };

  const dot = result
    ? result.ok ? "bg-green-500" : "bg-red-500"
    : testing ? "bg-yellow-500 animate-pulse" : "bg-gray-300";

  const label = testing
    ? "Testing…"
    : result
      ? result.ok ? `Connected — ${result.stage}` : `Failed — ${result.stage}`
      : apiKey ? "Credentials entered — not tested" : "No API key";

  const stageHint: Record<string, string> = {
    "Local Proxy":      "The request never reached Cohere. Check the local Express proxy server and API base URL.",
    "Upstream Auth":    "The proxy reached Cohere, but the API key was rejected.",
    "Rate Limit":       "The proxy reached Cohere, but the request was rate-limited.",
    "Response Shape":   "Cohere returned HTTP 200, but the payload was unusable.",
    "Upstream Error":   "Cohere returned an unexpected upstream error.",
  };

  const debugContext = getConnectionDebugContext(apiKey);

  // Read panel-level visibility from UiState (debug subpanel only)
  const debugHidden = ui.panels["panel-debug-connection"]?.hidden ?? true;

  return (
    <div
      id={IDS.settingsCard("connection")}
      className={CLS.settingsCard}
      {...DATA.panelId("panel-connection")}
      {...DATA.panelHidden(ui.panels["panel-connection"]?.hidden ?? false)}
    >
      <h3 className="settings-card__heading">
        <span aria-hidden="true">🔑 </span>Cohere Connection (via local proxy)
      </h3>

      {/* Status indicator */}
      <div className="flex items-center gap-2 mb-4" role="status" aria-live="polite">
        <div className={`w-2.5 h-2.5 rounded-full ${dot}`} aria-hidden="true" />
        <span className="text-sm font-semibold text-gray-600">{label}</span>
      </div>

      <button
        id={IDS.actionTestConnection}
        className={CLS.actionSecondary}
        onClick={handleTest}
        disabled={testing}
        aria-busy={testing}
      >
        {testing ? "⏳ Testing…" : "⚡ Test Connection"}
      </button>

      {/* Debug section */}
      {(testing || result || debugMessages.length > 0) && (
        <div
          id={IDS.debugPanelConnection}
          className="mt-3"
          {...DATA.panelHidden(debugHidden && !testing && !result)}
        >
          {result && !result.ok && stageHint[result.stage] && (
            <p className="text-xs text-red-500 mb-2">{stageHint[result.stage]}</p>
          )}

          <button
            className={CLS.actionGhost}
            onClick={() => setShowDebug(v => !v)}
            aria-expanded={showDebug}
          >
            {showDebug ? "▾ Hide" : "▸ Show"} debug
          </button>

          {showDebug && (
            <div className={`mt-2 rounded-lg border p-3 text-xs whitespace-pre-wrap break-words space-y-3
              ${result?.ok ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}
            >
              <div>
                <p className="font-semibold text-slate-700 mb-1">Debug Context</p>
                <div className="text-slate-600 space-y-0.5">
                  <div>Configured VITE_API_BASE_URL: {debugContext.configuredApiBase || "(empty)"}</div>
                  <div>Resolved API base: {debugContext.resolvedApiBase}</div>
                  <div>Proxy endpoint: {debugContext.proxyEndpoint}</div>
                  <div>Client fallback key present: {debugContext.clientKeyPresent ? "yes" : "no"}</div>
                </div>
                {debugContext.warnings.length > 0 && (
                  <div className="mt-2 text-amber-700">
                    {debugContext.warnings.map((w, i) => <div key={i}>Warning: {w}</div>)}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Debug Log</p>
                <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-slate-700">
                  {debugMessages.length > 0 ? debugMessages.join("\\n") : "No debug messages yet."}
                </pre>
              </div>
              {result && (
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Result Detail</p>
                  <pre className={`${result.ok ? "text-green-700" : "text-red-700"} max-h-40 overflow-y-auto whitespace-pre-wrap`}>
                    {result.detail}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
