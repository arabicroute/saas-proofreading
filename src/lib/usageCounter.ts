// Tracks the monthly API call count (trial ceiling: 1,000/month).
// Uses localStorage in the self-hosted build (no sandbox restriction).
// Intentionally simple — a localStorage counter is imperfect (resettable)
// but sufficient until a backend provides an authoritative count.

const STORAGE_KEY = "cohere_monthly_calls";
const STORAGE_META = "cohere_monthly_meta";

interface UsageMeta {
  month: string; // "YYYY-MM"
  count: number;
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function getMonthlyUsage(): UsageMeta {
  try {
    const raw = localStorage.getItem(STORAGE_META);
    if (raw) {
      const meta = JSON.parse(raw) as UsageMeta;
      if (meta.month === currentMonth()) return meta;
    }
  } catch { /* ignore */ }
  // First use or new month — reset
  return { month: currentMonth(), count: 0 };
}

export function incrementMonthlyUsage(): UsageMeta {
  const meta = getMonthlyUsage();
  meta.count++;
  try {
    localStorage.setItem(STORAGE_META, JSON.stringify(meta));
    localStorage.setItem(STORAGE_KEY, String(meta.count));
  } catch { /* ignore */ }
  return meta;
}

export function resetMonthlyUsage(): void {
  const meta: UsageMeta = { month: currentMonth(), count: 0 };
  try {
    localStorage.setItem(STORAGE_META, JSON.stringify(meta));
    localStorage.setItem(STORAGE_KEY, "0");
  } catch { /* ignore */ }
}
