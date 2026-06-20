import { useState } from "react";
import { useAppState } from "../../context/AppContext";
import type { Recommendation } from "../../types/recommendation";

function RecommendationCard({ rec, index, flagged }: { rec: Recommendation; index: number; flagged: boolean }) {
  return (
    <div className={`rounded-lg border p-4 mb-3 ${flagged ? "bg-amber-50 border-amber-300" : "bg-white border-gray-200"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
        {flagged && (
          <span className="text-xs bg-amber-200 text-amber-800 rounded px-2 py-0.5 font-semibold">
            ⚠ Needs review — partial fix detected
          </span>
        )}
      </div>
      <div className="space-y-2 text-sm" dir="rtl">
        <div>
          <span className="text-xs font-bold text-gray-500 block mb-0.5">العبارة (Anchor)</span>
          <p className="arabic-text bg-red-50 rounded px-2 py-1 text-red-800 border border-red-100">{rec["العبارة"]}</p>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-500 block mb-0.5">الخطأ (Error)</span>
          <p className="arabic-text bg-gray-50 rounded px-2 py-1 text-gray-700">{rec["الخطأ"]}</p>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-500 block mb-0.5">التصحيح (Correction)</span>
          <p className="arabic-text bg-green-50 rounded px-2 py-1 text-green-800 border border-green-100">{rec["التصحيح"]}</p>
        </div>
        {rec._conflictsWith && (
          <p className="text-xs text-amber-600">
            Conflict: correction still contains anchor from another entry: "{rec._conflictsWith}"
          </p>
        )}
      </div>
    </div>
  );
}

export function OutputTab() {
  const { result } = useAppState();
  const [showFlagged, setShowFlagged] = useState(true);

  if (!result) {
    return (
      <div className="rounded-xl bg-white p-10 shadow-sm text-center text-gray-400">
        <div className="text-4xl mb-3">📄</div>
        Results will appear here after proofreading completes.
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
    const a    = Object.assign(document.createElement("a"), { href: url, download: "proofreading_result.json" });
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total",    value: stats.total             },
            { label: "Clean",    value: stats.clean,  ok: true  },
            { label: "Flagged",  value: stats.leaked            },
            { label: "No-op",    value: stats.noOp              },
          ].map(({ label, value, ok }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className={`text-xl font-bold ${ok ? "text-green-600" : "text-[#1c2b4a]"}`}>{value}</div>
            </div>
          ))}
        </div>
        <button
          onClick={handleExport}
          className="bg-[#1c2b4a] text-white rounded-lg px-4 py-2 text-sm font-semibold
                     hover:bg-[#2d3f6b] transition-colors"
        >
          ⬇ Export JSON
        </button>
      </div>

      {/* Clean results */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">
          ✅ Clean Recommendations ({clean.length})
        </h3>
        {clean.length === 0
          ? <p className="text-sm text-gray-400">No clean recommendations.</p>
          : clean.map((r, i) => <RecommendationCard key={i} rec={r} index={i} flagged={false} />)
        }
      </div>

      {/* Flagged results */}
      {flagged.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-5">
          <button
            onClick={() => setShowFlagged(v => !v)}
            className="flex items-center gap-2 font-bold text-amber-800 mb-2 w-full text-left"
          >
            <span>{showFlagged ? "▾" : "▸"}</span>
            ⚠ {flagged.length} item{flagged.length !== 1 ? "s" : ""} need review
            <span className="text-xs font-normal text-amber-600 ml-1">(partial fix detected)</span>
          </button>
          {showFlagged && flagged.map((r, i) =>
            <RecommendationCard key={i} rec={r} index={i} flagged />
          )}
        </div>
      )}
    </div>
  );
}
