import { useAppDispatch, useAppState } from "../../context/AppContext";
import {
  AVAILABLE_MODELS,
  PRODUCTION_DEFAULTS,
  TESTING_DEFAULTS,
  isFeatureConfigFieldEditable,
} from "../../config/featureConfig";
import { ConnectionPanel } from "../shared/ConnectionPanel";
import { UsageMonitor } from "../shared/UsageMonitor";
import type { CustomInstructionsMode, FeatureConfig } from "../../types/featureConfig";
import { CLS, DATA, IDS } from "../../lib/uiSelectors";

export function ConfigTab() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { cfg, apiKey, ui } = state;

  const set = (patch: Partial<FeatureConfig>) => dispatch({ type: "SET_CFG", cfg: patch });
  const isLocked = (field: keyof FeatureConfig) => !isFeatureConfigFieldEditable(cfg.tier, field);

  const switchTier = (tier: "testing" | "production") => {
    const defaults = tier === "testing" ? TESTING_DEFAULTS : PRODUCTION_DEFAULTS;
    dispatch({ type: "SET_CFG", cfg: defaults });
  };

  const panelProps = (panelId: Parameters<typeof DATA.panelId>[0]) => ({
    ...DATA.panelId(panelId),
    ...DATA.panelHidden(ui.panels[panelId]?.hidden ?? false),
  });

  return (
    <div className="space-y-4">
      <div id={IDS.settingsCard("api-key")} className={CLS.settingsCard} {...panelProps("panel-api-key")}>
        <h3 className="settings-card__heading">
          <span aria-hidden="true">🔑 </span>API Key
        </h3>
        <p className={`${CLS.fieldCaption} mb-2 text-red-500`}>
          Preferred: set <code>COHERE_API_KEY</code> on the local proxy. This field is a
          client-side fallback for dev/testing only.
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => dispatch({ type: "SET_API_KEY", key: e.target.value })}
          placeholder="co-..."
          className={CLS.fieldInput}
        />
      </div>

      <ConnectionPanel />

      <div id={IDS.settingsCard("tier")} className={CLS.settingsCard} {...panelProps("panel-tier")}>
        <h3 className="settings-card__heading">
          <span aria-hidden="true">⚙ </span>Plan Tier
        </h3>
        <div className={CLS.segmentGroup}>
          {(["testing", "production"] as const).map((tier) => (
            <button
              key={tier}
              className={CLS.segmentButton}
              {...DATA.selected(cfg.tier === tier)}
              onClick={() => switchTier(tier)}
              type="button"
            >
              {tier === "testing" ? "🔬 Testing" : "🚀 Production"}
            </button>
          ))}
        </div>
        {cfg.tier === "production" && (
          <div className="mt-2 space-y-1">
            <p className={`${CLS.fieldCaption} text-amber-600`}>
              Command A+ production access requires contacting Cohere sales. It is not self-serve.
            </p>
            <p className={`${CLS.fieldCaption} text-amber-600`}>
              Locked in Production: switch to Testing to adjust advanced runtime settings.
            </p>
          </div>
        )}
      </div>

      <div id={IDS.settingsCard("model")} className={CLS.settingsCard} {...panelProps("panel-model")}>
        <h3 className="settings-card__heading">
          <span aria-hidden="true">🤖 </span>Model
        </h3>
        <select
          value={cfg.modelId}
          disabled={isLocked("modelId")}
          onChange={(e) => set({ modelId: e.target.value as FeatureConfig["modelId"] })}
          className={`${CLS.fieldSelect} ${isLocked("modelId") ? "cursor-not-allowed bg-gray-50 opacity-50" : ""}`}
        >
          {AVAILABLE_MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label}
            </option>
          ))}
        </select>
      </div>

      <div
        id={IDS.settingsCard("inference")}
        className={CLS.settingsCard}
        {...panelProps("panel-inference")}
      >
        <h3 className="settings-card__heading">
          <span aria-hidden="true">🌡 </span>Inference Parameters
        </h3>
        <div className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between">
              <label htmlFor="param-temperature" className={CLS.fieldLabel}>
                Temperature
              </label>
              <span className="text-sm font-bold text-[--color-brand-900]">{cfg.temperature.toFixed(2)}</span>
            </div>
            <p className={CLS.fieldCaption}>
              Values below 0.4 have been empirically observed to degrade output with this model.
              Re-verify before lowering.
            </p>
            <input
              id="param-temperature"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={cfg.temperature}
              disabled={isLocked("temperature")}
              onChange={(e) => set({ temperature: Number(e.target.value) })}
              className={`${CLS.fieldRange} mt-1 ${isLocked("temperature") ? "cursor-not-allowed opacity-40" : ""}`}
            />
          </div>

          <div>
            <div className="mb-1 flex justify-between">
              <label htmlFor="param-seed" className={CLS.fieldLabel}>
                Seed
              </label>
              <span className="text-sm font-bold text-[--color-brand-900]">{cfg.seed}</span>
            </div>
            <input
              id="param-seed"
              type="number"
              value={cfg.seed}
              disabled={isLocked("seed")}
              onChange={(e) => set({ seed: parseInt(e.target.value, 10) || 42 })}
              className={`${CLS.fieldInput} ${isLocked("seed") ? "cursor-not-allowed bg-gray-50 opacity-50" : ""}`}
            />
          </div>

          <div>
            <div className="mb-1 flex justify-between">
              <p className={CLS.fieldLabel}>Thinking</p>
              <span className="text-sm font-bold text-[--color-brand-900]">
                {cfg.thinkingDisabled ? "Disabled" : "Enabled"}
              </span>
            </div>
            <button
              role="switch"
              aria-checked={!cfg.thinkingDisabled}
              aria-label="Toggle model thinking"
              {...DATA.checked(!cfg.thinkingDisabled)}
              className={`${CLS.toggleSwitch} ${isLocked("thinkingDisabled") ? "cursor-not-allowed opacity-50" : ""}`}
              onClick={() => {
                if (isLocked("thinkingDisabled")) return;
                set({ thinkingDisabled: !cfg.thinkingDisabled });
              }}
              disabled={isLocked("thinkingDisabled")}
              type="button"
            >
              <span className={CLS.toggleSwitchTrack}>
                <span className={CLS.toggleSwitchThumb} />
              </span>
              <span className="text-sm font-semibold text-gray-700">
                {cfg.thinkingDisabled ? "Send thinking: disabled" : "Allow model thinking"}
              </span>
            </button>
            <p className={CLS.fieldCaption}>
              This setting is sent to the model and is also honored by the connection test.
            </p>
          </div>

          <div>
            <div className="mb-1 flex justify-between">
              <label htmlFor="param-chunk" className={CLS.fieldLabel}>
                Max Chunk Characters
              </label>
              <span className="text-sm font-bold text-[--color-brand-900]">
                {cfg.maxChunkChars.toLocaleString()}
              </span>
            </div>
            <input
              id="param-chunk"
              type="range"
              min={500}
              max={8000}
              step={100}
              value={cfg.maxChunkChars}
              disabled={isLocked("maxChunkChars")}
              onChange={(e) => set({ maxChunkChars: Number(e.target.value) })}
              className={`${CLS.fieldRange} ${isLocked("maxChunkChars") ? "cursor-not-allowed opacity-40" : ""}`}
            />
          </div>
        </div>
      </div>

      <div
        id={IDS.settingsCard("multiturn")}
        className={CLS.settingsCardCompact}
        {...panelProps("panel-multiturn")}
      >
        <h3 className="settings-card__heading">
          <span aria-hidden="true">🔄 </span>Multi-Turn Chunking
        </h3>
        <button
          role="switch"
          aria-checked={cfg.multiTurn}
          aria-label="Toggle multi-turn chunking"
          {...DATA.checked(cfg.multiTurn)}
          className={`${CLS.toggleSwitch} ${isLocked("multiTurn") ? "cursor-not-allowed opacity-50" : ""}`}
          onClick={() => {
            if (isLocked("multiTurn")) return;
            set({ multiTurn: !cfg.multiTurn });
          }}
          disabled={isLocked("multiTurn")}
          type="button"
        >
          <span className={CLS.toggleSwitchTrack}>
            <span className={CLS.toggleSwitchThumb} />
          </span>
          <span className="text-sm font-semibold text-gray-700">
            {cfg.multiTurn
              ? "Multi-turn (chunks as conversation turns)"
              : "Stateless (independent calls per chunk)"}
          </span>
        </button>
        <p className={CLS.fieldCaption}>
          Multi-turn sends the system prompt once and appends chunks. Stateless re-sends the
          full system prompt per chunk.
        </p>
      </div>

      <div
        id={IDS.settingsCard("instructions")}
        className={CLS.settingsCard}
        {...panelProps("panel-instructions")}
      >
        <h3 className="settings-card__heading">
          <span aria-hidden="true">📋 </span>Custom Instructions
        </h3>
        <div className={`${CLS.segmentGroup} mb-3`}>
          {(["none", "additive", "override"] as CustomInstructionsMode[]).map((mode) => (
            <button
              key={mode}
              className={CLS.segmentButton}
              {...DATA.selected(cfg.customInstructionsMode === mode)}
              onClick={() => set({ customInstructionsMode: mode })}
              type="button"
            >
              {mode === "none" ? "None" : mode === "additive" ? "Additive" : "Override"}
            </button>
          ))}
        </div>
        {cfg.customInstructionsMode === "override" && (
          <p className={`${CLS.fieldCaption} mb-2 text-amber-600`}>
            Override replaces editorial preferences only. Structural output rules are always
            enforced.
          </p>
        )}
        {cfg.customInstructionsMode !== "none" && (
          <textarea
            dir="rtl"
            value={cfg.customInstructions}
            onChange={(e) => set({ customInstructions: e.target.value })}
            rows={4}
            placeholder="أدخل تعليمات إضافية هنا…"
            className={`${CLS.fieldTextarea} arabic-text resize-y`}
          />
        )}
      </div>

      <UsageMonitor />
    </div>
  );
}
