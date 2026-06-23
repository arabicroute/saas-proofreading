import { useAppDispatch, useAppState } from "../../context/AppContext";
import { KEY_OPTIONS } from "../../lib/apiKeys";
import type { KeySlot } from "../../types/appConfig";
import { CLS, DATA, IDS } from "../../lib/uiSelectors";

export function AppConfigTab() {
  const { appConfig, selectedKeySlot, ui } = useAppState();
  const dispatch = useAppDispatch();

  const hasClientKeys = KEY_OPTIONS.length > 0;
  const activeKeyLabel =
    selectedKeySlot !== null
      ? KEY_OPTIONS.find((option) => option.slot === selectedKeySlot)?.label ?? `Key ${selectedKeySlot}`
      : "None";

  const panelProps = (panelId: Parameters<typeof DATA.panelId>[0]) => ({
    ...DATA.panelId(panelId),
    ...DATA.panelHidden(ui.panels[panelId]?.hidden ?? false),
  });

  return (
    <div className="space-y-4">
      <div id={IDS.settingsCard("default-api-key")} className={CLS.settingsCard} {...panelProps("panel-default-api-key")}>
        <h3 className="settings-card__heading">
          <span aria-hidden="true">🔧 </span>Default API Key Slot
        </h3>
        <p className={`${CLS.fieldCaption} mb-2`}>
          Choose which client-side key is auto-selected when the app starts. Change the active key
          for this session in the AI Config tab.
        </p>
        {hasClientKeys ? (
          <>
            <select
              value={appConfig.defaultKeySlot}
              onChange={(e) =>
                dispatch({
                  type: "SET_APP_CONFIG_DEFAULT_SLOT",
                  slot: Number(e.target.value) as KeySlot,
                })
              }
              className={CLS.fieldSelect}
              aria-label="Default API key slot"
            >
              {KEY_OPTIONS.map((option) => (
                <option key={option.slot} value={option.slot}>
                  {option.label} (slot {option.slot})
                </option>
              ))}
            </select>
            <p className={`${CLS.fieldCaption} mt-2 text-green-700`}>Current active key: {activeKeyLabel}</p>
          </>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
            No configured client-side API keys were found. Add `VITE_COHERE_API_KEY_1..10` values
            to your local `.env` file and restart the dev server.
          </div>
        )}
      </div>

      <div id={IDS.settingsCard("locale")} className={CLS.settingsCard} {...panelProps("panel-locale")}>
        <h3 className="settings-card__heading">
          <span aria-hidden="true">🌐 </span>Locale
        </h3>
        <p className={`${CLS.fieldCaption} mb-2`}>
          Reserved for future language and locale settings.
        </p>
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          Coming soon.
        </div>
      </div>
    </div>
  );
}
