import type { ChunkProgress } from "../../lib/proofreadingSession";

const STATUS_ICON:  Record<string, string> = { pending: "○", running: "◌", done: "✓", error: "✗" };
const STATUS_COLOR: Record<string, string> = {
  pending: "text-gray-400",
  running: "text-yellow-500 animate-spin",
  done:    "text-green-600",
  error:   "text-red-500",
};

interface Props {
  progress: ChunkProgress[];
}

export function ChunkProgressList({ progress }: Props) {
  if (progress.length === 0) return null;
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm mt-4">
      <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">Analysis Progress</h3>
      {progress.map((p) => (
        <div key={p.index} className="flex items-center gap-3 py-2 border-b last:border-0">
          <span className={`text-lg w-6 text-center ${STATUS_COLOR[p.status]}`}>
            {STATUS_ICON[p.status]}
          </span>
          <span className="flex-1 text-sm text-gray-700">
            Chunk {p.index + 1} of {p.total}
          </span>
          {p.errorMessage && (
            <span className="text-xs text-red-400 truncate max-w-xs">{p.errorMessage}</span>
          )}
          <span className="text-xs font-semibold capitalize text-gray-500">{p.status}</span>
        </div>
      ))}
    </div>
  );
}
