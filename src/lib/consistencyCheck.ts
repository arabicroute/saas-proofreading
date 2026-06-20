// Post-processes a chunk's raw recommendations BEFORE merging into final output.
// Ported directly from consistency-check.js with TypeScript types applied.

import type { Recommendation, ChunkResult, ConsistencyStats, MergedResult } from "../types/recommendation";

function emptyStats(): ConsistencyStats {
  return { total: 0, noOp: 0, leaked: 0, malformed: 0, clean: 0 };
}

export function checkRecommendations(recs: Recommendation[]): ChunkResult {
  if (!Array.isArray(recs)) return { clean: [], flagged: [], stats: emptyStats() };

  const stats = emptyStats();
  stats.total = recs.length;

  // ── Pass 1: filter no-op and malformed entries ────────────────────────────
  const afterNoOpFilter: Recommendation[] = [];

  for (const rec of recs) {
    const anchor     = (rec["العبارة"]  ?? "").trim();
    const correction = (rec["التصحيح"] ?? "").trim();

    if (!anchor || !correction || !rec["الخطأ"]?.trim()) {
      stats.malformed++;
      continue;
    }

    if (anchor === correction) {
      stats.noOp++;
      continue; // silently drop
    }

    afterNoOpFilter.push(rec);
  }

  // ── Pass 2: detect leaked / uncorrected spans ─────────────────────────────
  const clean: Recommendation[]   = [];
  const flagged: Recommendation[] = [];

  for (let i = 0; i < afterNoOpFilter.length; i++) {
    const current    = afterNoOpFilter[i];
    const correction = current["التصحيح"];
    let leakedFrom: Recommendation | null = null;

    for (let j = 0; j < afterNoOpFilter.length; j++) {
      if (i === j) continue;
      const otherAnchor = afterNoOpFilter[j]["العبارة"].trim();

      // Guard against short particles causing false positives
      if (otherAnchor.length >= 4 && correction.includes(otherAnchor)) {
        leakedFrom = afterNoOpFilter[j];
        break;
      }
    }

    if (leakedFrom) {
      stats.leaked++;
      flagged.push({
        ...current,
        _flagReason: "leaked_uncorrected_span",
        _conflictsWith: leakedFrom["العبارة"],
      });
    } else {
      clean.push(current);
    }
  }

  stats.clean = clean.length;
  return { clean, flagged, stats };
}

export function mergeChunkResults(chunkResultsArray: ChunkResult[]): MergedResult {
  const allClean:   Recommendation[] = [];
  const allFlagged: Recommendation[] = [];
  const seenAnchors = new Set<string>();
  const totals = emptyStats();

  for (const { clean, flagged, stats } of chunkResultsArray) {
    totals.total    += stats.total;
    totals.noOp     += stats.noOp;
    totals.leaked   += stats.leaked;
    totals.malformed += stats.malformed;

    for (const rec of clean) {
      const anchor = rec["العبارة"].trim();
      if (seenAnchors.has(anchor)) continue;
      seenAnchors.add(anchor);
      allClean.push(rec);
    }
    allFlagged.push(...flagged);
  }

  totals.clean = allClean.length;
  return { clean: allClean, flagged: allFlagged, stats: totals };
}
