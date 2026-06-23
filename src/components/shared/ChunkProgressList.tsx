
// src/components/shared/ChunkProgressList.tsx
import type { ChunkProgress } from "../../lib/proofreadingSession";
import { CLS } from "../../lib/uiSelectors";

const STATUS_ICON: Record<string, string> = {
  pending: "○",
  running: "◌",
  done:    "✓",
  error:   "✗",
};

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
    <div
      className={`${CLS.settingsCard} mt-4`}
      aria-live="polite"
      aria-label="Chunk analysis progress"
    >
      <h3 className="settings-card__heading">
        <span aria-hidden="true">⏳ </span>Analysis Progress
      </h3>

      <ol className="list-none m-0 p-0">
        {progress.map((p) => (
          <li
            key={p.index}
            className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
            aria-label={`Chunk ${p.index + 1} of ${p.total}: ${p.status}${p.errorMessage ? " — " + p.errorMessage : ""}`}
          >
            {/* Decorative status icon — meaning carried by aria-label above */}
            <span
              aria-hidden="true"
              className={`text-lg w-6 text-center ${STATUS_COLOR[p.status]}`}
            >
              {STATUS_ICON[p.status]}
            </span>

            <span className="flex-1 text-sm text-gray-700">
              Chunk {p.index + 1} of {p.total}
            </span>

            {p.errorMessage && (
              <span className="text-xs text-red-400 truncate max-w-xs">
                {p.errorMessage}
              </span>
            )}

            <span className="text-xs font-semibold capitalize text-gray-500">
              {p.status}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
