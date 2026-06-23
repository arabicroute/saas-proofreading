
// src/components/shared/UsageMonitor.tsx
import { useEffect, useState } from "react";
import { getMonthlyUsage, resetMonthlyUsage } from "../../lib/usageCounter";
import { useAppState } from "../../context/AppContext";
import { CLS, IDS, DATA } from "../../lib/uiSelectors";

export function UsageMonitor() {
  const { cfg, ui } = useAppState();
  const [usage, setUsage] = useState(getMonthlyUsage());

  // Refresh on mount and whenever the window regains focus
  useEffect(() => {
    const refresh = () => setUsage(getMonthlyUsage());
    window.addEventListener("focus", refresh);
    refresh();
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const ceiling  = cfg.monthlyCallCeiling;
  const pct      = ceiling ? Math.min(100, Math.round((usage.count / ceiling) * 100)) : 0;
  const barColor = !ceiling || pct < 70
    ? "bg-green-500"
    : pct < 90 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div
      id={IDS.settingsCard("usage")}
      className={CLS.settingsCard}
      {...DATA.panelId("panel-usage")}
      {...DATA.panelHidden(ui.panels["panel-usage"]?.hidden ?? false)}
    >
      <h3 className="settings-card__heading">
        <span aria-hidden="true">📊 </span>Monthly Usage
      </h3>

      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-500">{usage.month}</span>
        <span className="font-bold text-[--color-brand-900]">
          {usage.count.toLocaleString()}
          {ceiling ? ` / ${ceiling.toLocaleString()}` : ""} calls
        </span>
      </div>

      {ceiling && (
        <>
          {/* Accessible progress bar */}
          <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Monthly usage: ${pct}%`}
            className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1"
          >
            <div
              className={`h-full ${barColor} rounded-full transition-all`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className={CLS.fieldCaption}>{pct}% of monthly trial ceiling used</p>
        </>
      )}

      {!ceiling && (
        <p className={CLS.fieldCaption}>
          Production tier — no monthly ceiling tracked client-side.
        </p>
      )}

      <button
        className={`${CLS.actionGhost} mt-3 text-red-400 hover:text-red-600 underline`}
        onClick={() => { resetMonthlyUsage(); setUsage(getMonthlyUsage()); }}
      >
        Reset counter
      </button>
    </div>
  );
}
