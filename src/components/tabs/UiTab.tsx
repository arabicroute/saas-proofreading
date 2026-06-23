import { useAppDispatch, useAppState, type AppTab } from "../../context/AppContext";
import { DENSITY_OPTIONS, SKIN_OPTIONS } from "../../config/uiConfig";
import { CLS, DATA, IDS } from "../../lib/uiSelectors";
import type { PanelId, UiDirOverride } from "../../types/uiConfig";

const DIR_OPTIONS: Array<{ id: UiDirOverride; label: string }> = [
  { id: "ltr", label: "LTR" },
  { id: "rtl", label: "RTL" },
  { id: "inherit", label: "Inherit" },
];

const OVERRIDEABLE_TABS: Array<{ id: AppTab; label: string }> = [
  { id: "config", label: "Config" },
  { id: "input", label: "Input" },
  { id: "output", label: "Output" },
];

export function UiTab() {
  const { ui } = useAppState();
  const dispatch = useAppDispatch();

  const configPanels = (Object.entries(ui.panels) as [PanelId, (typeof ui.panels)[PanelId]][]).filter(
    ([, panel]) => panel.tab === "config"
  );
  const outputPanels = (Object.entries(ui.panels) as [PanelId, (typeof ui.panels)[PanelId]][]).filter(
    ([, panel]) => panel.tab === "output"
  );

  return (
    <div id={IDS.tabPanel("appearance")} className="space-y-4">
      <div id={IDS.settingsCard("skin")} className={CLS.settingsCard}>
        <h3 className="settings-card__heading">
          <span aria-hidden="true">🎨 </span>Color Skin
        </h3>
        <div className="space-y-2">
          {SKIN_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={CLS.skinOption}
              {...DATA.selected(ui.skin === option.id)}
              onClick={() => dispatch({ type: "SET_UI_SKIN", skin: option.id })}
              type="button"
            >
              <span className={`skin-option__swatch ${option.swatchBg}`} aria-hidden="true" />
              <span className="flex flex-col items-start">
                <span className="text-sm font-semibold text-gray-800">{option.label}</span>
                <span className="field-caption">{option.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div id={IDS.settingsCard("density")} className={CLS.settingsCard}>
        <h3 className="settings-card__heading">
          <span aria-hidden="true">⬜ </span>Layout Density
        </h3>
        <div className={CLS.segmentGroup}>
          {DENSITY_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={CLS.segmentButton}
              {...DATA.selected(ui.density === option.id)}
              onClick={() => dispatch({ type: "SET_UI_DENSITY", density: option.id })}
              title={option.description}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="field-caption mt-2">
          {DENSITY_OPTIONS.find((option) => option.id === ui.density)?.description}
        </p>
      </div>

      <div id={IDS.settingsCard("direction")} className={CLS.settingsCard}>
        <h3 className="settings-card__heading">
          <span aria-hidden="true">↔ </span>Text Direction
        </h3>
        <div className="mb-4">
          <p className="field-label mb-1">Global direction</p>
          <p className="field-caption mb-2">
            Applies to the whole shell. Per-tab overrides below can refine this.
          </p>
          <div className={CLS.segmentGroup}>
            {(["ltr", "rtl"] as const).map((dir) => (
              <button
                key={dir}
                className={CLS.segmentButton}
                {...DATA.selected(ui.dir.global === dir)}
                onClick={() => dispatch({ type: "SET_UI_DIR", dir })}
                type="button"
              >
                {dir.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="field-label">Per-tab overrides</p>
          {OVERRIDEABLE_TABS.map((tab) => {
            const current = ui.dir.pageOverride[tab.id] ?? "inherit";
            return (
              <div key={tab.id} className="flex flex-wrap items-center gap-3">
                <span className="field-label w-16 shrink-0">{tab.label}</span>
                <div className={`${CLS.segmentGroup} flex-1`}>
                  {DIR_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      className={CLS.segmentButton}
                      {...DATA.selected(current === option.id)}
                      onClick={() =>
                        dispatch({ type: "SET_UI_DIR_OVERRIDE", tab: tab.id, dir: option.id })
                      }
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div id={IDS.settingsCard("panels")} className={CLS.settingsCard}>
        <h3 className="settings-card__heading">
          <span aria-hidden="true">👁 </span>Panel Visibility
        </h3>
        <p className="field-label mb-2">Config tab</p>
        <div className="mb-4 space-y-2">
          {configPanels.map(([panelId, panel]) => (
            <PanelToggleRow
              key={panelId}
              label={panel.label}
              hidden={panel.hidden}
              onToggle={(hidden) => dispatch({ type: "SET_PANEL_HIDDEN", panelId, hidden })}
            />
          ))}
        </div>

        <p className="field-label mb-2">Output tab</p>
        <div className="space-y-2">
          {outputPanels.map(([panelId, panel]) => (
            <PanelToggleRow
              key={panelId}
              label={panel.label}
              hidden={panel.hidden}
              onToggle={(hidden) => dispatch({ type: "SET_PANEL_HIDDEN", panelId, hidden })}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button className={CLS.actionGhost} onClick={() => dispatch({ type: "RESET_UI" })} type="button">
          Reset appearance to defaults
        </button>
      </div>
    </div>
  );
}

function PanelToggleRow({
  label,
  hidden,
  onToggle,
}: {
  label: string;
  hidden: boolean;
  onToggle: (hidden: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        role="switch"
        aria-checked={!hidden}
        aria-label={`${hidden ? "Show" : "Hide"} ${label}`}
        {...DATA.checked(!hidden)}
        className={CLS.toggleSwitch}
        onClick={() => onToggle(!hidden)}
        type="button"
      >
        <span className={CLS.toggleSwitchTrack}>
          <span className={CLS.toggleSwitchThumb} />
        </span>
      </button>
    </div>
  );
}
