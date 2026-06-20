import { useEffect, useState } from "react";
import { getMonthlyUsage, resetMonthlyUsage } from "../../lib/usageCounter";
import { useAppState } from "../../context/AppContext";

export function UsageMonitor() {
  const { cfg } = useAppState();
  const [usage, setUsage] = useState(getMonthlyUsage());

  // Refresh whenever the component mounts or the window regains focus
  useEffect(() => {
    const refresh = () => setUsage(getMonthlyUsage());
    window.addEventListener("focus", refresh);
    refresh();
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const ceiling  = cfg.monthlyCallCeiling;
  const pct      = ceiling ? Math.min(100, Math.round((usage.count / ceiling) * 100)) : 0;
  const barColor = !ceiling || pct < 70 ? "bg-green-500" : pct < 90 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm mb-4">
      <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">📊 Monthly Usage</h3>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-500">{usage.month}</span>
        <span className="font-bold text-[#1c2b4a]">
          {usage.count.toLocaleString()}
          {ceiling ? ` / ${ceiling.toLocaleString()}` : ""} calls
        </span>
      </div>
      {ceiling && (
        <>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
            <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-400">{pct}% of monthly trial ceiling used</p>
        </>
      )}
      {!ceiling && (
        <p className="text-xs text-gray-400">Production tier — no monthly ceiling tracked client-side.</p>
      )}
      <button
        onClick={() => { resetMonthlyUsage(); setUsage(getMonthlyUsage()); }}
        className="mt-3 text-xs text-red-400 hover:text-red-600 underline"
      >
        Reset counter
      </button>
    </div>
  );
}
