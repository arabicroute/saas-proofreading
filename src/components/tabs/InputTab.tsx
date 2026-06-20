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

  const canSubmit = !!inputText.trim() && !running;

  return (
    <div className="space-y-4">
      {!apiKey && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700">
          ⚠ No client-side API key is set. That is fine if the local proxy has `COHERE_API_KEY` configured server-side.
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
