
// src/components/tabs/InputTab.tsx
import { useRef } from "react";
import { useAppState, useAppDispatch } from "../../context/AppContext";
import { runProofreadingSession } from "../../lib/proofreadingSession";
import { ChunkProgressList } from "../shared/ChunkProgressList";
import { CLS, IDS } from "../../lib/uiSelectors";

export function InputTab() {
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const fileRef  = useRef<HTMLInputElement>(null);

  const { inputText, inputFileName, running, progress, sessionError, apiKey, cfg, promptOverride } = state;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev =>
      dispatch({ type: "SET_INPUT", text: String(ev.target?.result ?? ""), fileName: file.name });
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    dispatch({ type: "SESSION_START" });
    try {
      const result = await runProofreadingSession({
        text: inputText, apiKey, cfg, promptOverride,
        onProgress: p => dispatch({ type: "SESSION_PROGRESS", progress: p }),
      });
      dispatch({ type: "SESSION_DONE",  result: result.merged });
      dispatch({ type: "SET_TAB",       tab: "output" });
    } catch (e: unknown) {
      dispatch({ type: "SESSION_ERROR", message: String((e as Error).message) });
    }
  };

  const canSubmit = !!inputText.trim() && !running;

  return (
    <div className="space-y-4">

      {/* No API key warning */}
      {!apiKey && (
        <div id={IDS.banner("no-api-key")} className={CLS.statusBannerWarn}>
          <span aria-hidden="true">⚠ </span>
          No client-side API key is set. That is fine if the local proxy
          has <code>COHERE_API_KEY</code> configured server-side.
        </div>
      )}

      {/* Text input card */}
      <div
        id={IDS.settingsCard("arabic-input")}
        className={CLS.settingsCard}
      >
        <h3 className="settings-card__heading">
          <span aria-hidden="true">✏ </span>Arabic Text
        </h3>
        <textarea
          id="input-arabic-text"
          dir="rtl"
          value={inputText}
          onChange={e => dispatch({ type: "SET_INPUT", text: e.target.value })}
          placeholder="أدخل النص العربي هنا للتدقيق اللغوي…"
          rows={10}
          aria-label="Arabic text to proofread"
          className={`${CLS.fieldTextarea} arabic-text resize-y`}
        />
        <div className="flex items-center gap-3 mt-2 flex-wrap" dir="ltr">
          <span className={`${CLS.fieldCaption} m-0`}>
            {inputText.length.toLocaleString()} characters
          </span>
          <button
            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5
                       hover:border-gray-500 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            Upload .txt
          </button>
          {inputFileName && (
            <span className="text-xs text-green-600">✓ {inputFileName}</span>
          )}
          <button
            className={CLS.actionGhost}
            onClick={() => dispatch({ type: "SET_INPUT", text: "" })}
          >
            Clear
          </button>
        </div>
        <input
          type="file"
          accept=".txt,.text"
          ref={fileRef}
          onChange={handleFile}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Session error */}
      {sessionError && (
        <div id={IDS.banner("session-error")} className={CLS.statusBannerError}>
          <span aria-hidden="true">⚠ </span>{sessionError}
        </div>
      )}

      {/* Primary action */}
      <button
        id={IDS.actionStartProofreading}
        className={CLS.actionPrimary}
        onClick={handleSubmit}
        disabled={!canSubmit}
        aria-busy={running}
      >
        {running ? "⏳ Proofreading in progress…" : "▶ Start Proofreading"}
      </button>

      <ChunkProgressList progress={progress} />

    </div>
  );
}
