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
          ⚠ Preferred: set `COHERE_API_KEY` on the local proxy. This field is now only a client-side fallback for dev/testing.
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
          {/* Thinking toggle */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="font-semibold text-gray-600">Thinking</label>
              <span className="font-bold text-[#1c2b4a]">
                {cfg.thinkingDisabled ? "Disabled" : "Enabled"}
              </span>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => set({ thinkingDisabled: !cfg.thinkingDisabled })}
                className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative
                  ${cfg.thinkingDisabled ? "bg-[#1c2b4a]" : "bg-gray-300"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all
                  ${cfg.thinkingDisabled ? "left-6" : "left-1"}`} />
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {cfg.thinkingDisabled ? "Send thinking: disabled" : "Allow model thinking"}
              </span>
            </label>
            <p className="text-xs text-gray-400 mt-2">
              This setting is sent to the model and is now also honored by the connection test.
            </p>
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
