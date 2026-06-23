
// src/components/tabs/OutputTab.tsx
import { useState } from "react";
import { useAppState } from "../../context/AppContext";
import type { Recommendation } from "../../types/recommendation";
import { CLS, IDS, DATA } from "../../lib/uiSelectors";

function RecommendationCard({
  rec, index, flagged,
}: { rec: Recommendation; index: number; flagged: boolean }) {
  const cardId = flagged
    ? IDS.resultCardFlagged(index)
    : IDS.resultCardClean(index);

  return (
    <div
      id={cardId}
      className={flagged ? CLS.resultCardFlagged : CLS.resultCardClean}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-gray-400" aria-hidden="true">#{index + 1}</span>
        {flagged && (
          <span className="text-xs bg-amber-200 text-amber-800 rounded px-2 py-0.5 font-semibold">
            ⚠ Needs review — partial fix detected
          </span>
        )}
      </div>
      {/* Use a definition list for accessible key-value pairs */}
      <dl className="space-y-2 text-sm" dir="rtl">
        <div>
          <dt className="text-xs font-bold text-gray-500 mb-0.5">العبارة (Anchor)</dt>
          <dd className="arabic-text bg-red-50 rounded px-2 py-1 text-red-800 border border-red-100">
            {rec["العبارة"]}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-gray-500 mb-0.5">الخطأ (Error)</dt>
          <dd className="arabic-text bg-gray-50 rounded px-2 py-1 text-gray-700">
            {rec["الخطأ"]}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-gray-500 mb-0.5">التصحيح (Correction)</dt>
          <dd className="arabic-text bg-green-50 rounded px-2 py-1 text-green-800 border border-green-100">
            {rec["التصحيح"]}
          </dd>
        </div>
        {rec._conflictsWith && (
          <div>
            <dt className="sr-only">Conflict warning</dt>
            <dd className="text-xs text-amber-600">
              Conflict: correction still contains anchor from another entry: "{rec._conflictsWith}"
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export function OutputTab() {
  const { result, ui } = useAppState();
  const [showFlagged, setShowFlagged] = useState(true);

  if (!result) {
    return (
      <div className={`${CLS.settingsCard} text-center py-10 text-gray-400`}>
        <div className="text-4xl mb-3" aria-hidden="true">📄</div>
        <p>Results will appear here after proofreading completes.</p>
      </div>
    );
  }

  const { clean, flagged, stats } = result;

  const handleExport = () => {
    const payload = {
      number_of_errors: String(clean.length + flagged.length),
      clean_recommendations: clean,
      flagged_recommendations: flagged,
      stats,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), {
      href: url, download: "proofreading_result.json",
    });
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const statCells = [
    { label: "Total",   value: stats.total,  accent: false },
    { label: "Clean",   value: stats.clean,  accent: true  },
    { label: "Flagged", value: stats.leaked, accent: false },
    { label: "No-op",   value: stats.noOp,   accent: false },
  ];

  return (
    <div className="space-y-4">

      {/* Stats bar */}
      <div
        id={IDS.statsPanel}
        className={CLS.settingsCard}
        {...DATA.panelId("panel-stats")}
        {...DATA.panelHidden(ui.panels["panel-stats"]?.hidden ?? false)}
      >
        {/* Accessible stats using dl */}
        <dl id="stats-grid" className={CLS.statsGrid} aria-label="Proofreading statistics">
          {statCells.map(({ label, value, accent }) => (
            <div key={label} className={CLS.statsCell}>
              <dt className="field-caption mb-1">{label}</dt>
              <dd className={`text-xl font-bold ${accent ? "text-green-600" : "text-[--color-brand-900]"}`}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <button
          id={IDS.actionExportJson}
          className={CLS.actionSecondary}
          onClick={handleExport}
        >
          ⬇ Export JSON
        </button>
      </div>

      {/* Clean results */}
      <div
        id={IDS.settingsCard("clean-results")}
        className={CLS.settingsCard}
        {...DATA.panelId("panel-clean-results")}
        {...DATA.panelHidden(ui.panels["panel-clean-results"]?.hidden ?? false)}
      >
        <h3 className="settings-card__heading">
          <span aria-hidden="true">✅ </span>
          Clean Recommendations ({clean.length})
        </h3>
        {clean.length === 0
          ? <p className="text-sm text-gray-400">No clean recommendations.</p>
          : clean.map((r, i) => (
              <RecommendationCard key={i} rec={r} index={i} flagged={false} />
            ))
        }
      </div>

      {/* Flagged results */}
      {flagged.length > 0 && (
        <div
          id={IDS.settingsCard("flagged-results")}
          className="settings-card status-banner--warn p-0 overflow-hidden"
          {...DATA.panelId("panel-flagged-results")}
          {...DATA.panelHidden(ui.panels["panel-flagged-results"]?.hidden ?? false)}
        >
          <button
            className="flex items-center gap-2 font-bold text-amber-800 w-full text-left p-4"
            onClick={() => setShowFlagged(v => !v)}
            aria-expanded={showFlagged}
          >
            <span aria-hidden="true">{showFlagged ? "▾" : "▸"}</span>
            <span aria-hidden="true">⚠ </span>
            {flagged.length} item{flagged.length !== 1 ? "s" : ""} need review
            <span className="text-xs font-normal text-amber-600 ml-1">(partial fix detected)</span>
          </button>
          {showFlagged && (
            <div className="px-4 pb-4">
              {flagged.map((r, i) => (
                <RecommendationCard key={i} rec={r} index={i} flagged />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
