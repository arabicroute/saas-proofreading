// ─── Recommendation Consistency Check ─────────────────────────────────────
//
// Post-processes a chunk's raw recommendations (Arabic-keyed, as returned by
// Cohere JSON mode) BEFORE merging into the final app-wide result.
//
// Catches two failure patterns observed in testing:
//   1. No-op entries        — العبارة === التصحيح (model described an error
//                              but didn't actually apply the fix)
//   2. Leaked / partial fix — a التصحيح still contains another entry's known-bad
//                              العبارة text verbatim, meaning that other error
//                              wasn't actually resolved within this correction
//
// Usage:
//   const { clean, flagged, stats } = checkRecommendations(rawRecs);
//   // clean   -> recs safe to merge into final output
//   // flagged -> recs that failed a check, with reason attached, for review/logging
//   // stats   -> counts for the Usage Monitor / debug panel

/**
 * @param {Array<{العبارة: string, الخطأ: string, التصحيح: string}>} recs
 * @returns {{ clean: Array, flagged: Array, stats: Object }}
 */
function checkRecommendations(recs) {
  if (!Array.isArray(recs)) return { clean: [], flagged: [], stats: emptyStats() };

  const stats = emptyStats();
  stats.total = recs.length;

  // ── Pass 1: filter no-op entries (anchor === correction) ──
  const afterNoOpFilter = [];
  for (const rec of recs) {
    const anchor     = (rec["العبارة"]  ?? "").trim();
    const correction = (rec["التصحيح"] ?? "").trim();

    if (!anchor || !correction) {
      stats.malformed++;
      continue; // drop entries missing required fields entirely
    }

    if (anchor === correction) {
      stats.noOp++;
      continue; // silently drop — this is the "minor, dedupe" case
    }

    afterNoOpFilter.push(rec);
  }

  // ── Pass 2: detect leaked/uncorrected spans ──
  // For each remaining correction, check whether it still contains the
  // verbatim anchor text of any OTHER entry in this same chunk.
  const clean   = [];
  const flagged = [];

  for (let i = 0; i < afterNoOpFilter.length; i++) {
    const current     = afterNoOpFilter[i];
    const correction  = current["التصحيح"];
    let   leakedFrom   = null;

    for (let j = 0; j < afterNoOpFilter.length; j++) {
      if (i === j) continue;
      const otherAnchor = afterNoOpFilter[j]["العبارة"].trim();

      // Only flag on reasonably specific substrings (avoid false positives
      // from very short anchors like single letters or short particles).
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

function emptyStats() {
  return { total: 0, noOp: 0, leaked: 0, malformed: 0, clean: 0 };
}

// ─── Merge helper for multi-chunk runs ─────────────────────────────────────
// Call checkRecommendations() per chunk, then merge clean results across
// all chunks. Cross-chunk anchor de-duplication (global, not leak-detection)
// happens here, mirroring the existing app's dedupe-by-anchor logic.

function mergeChunkResults(chunkResultsArray) {
  const allClean   = [];
  const allFlagged = [];
  const seenAnchors = new Set();

  const totals = emptyStats();

  for (const { clean, flagged, stats } of chunkResultsArray) {
    totals.total     += stats.total;
    totals.noOp       += stats.noOp;
    totals.leaked      += stats.leaked;
    totals.malformed   += stats.malformed;

    for (const rec of clean) {
      const anchor = rec["العبارة"].trim();
      if (seenAnchors.has(anchor)) continue; // global anchor dedupe
      seenAnchors.add(anchor);
      allClean.push(rec);
    }
    allFlagged.push(...flagged);
  }

  totals.clean = allClean.length;

  return { clean: allClean, flagged: allFlagged, stats: totals };
}

// ─── Example usage ──────────────────────────────────────────────────────────
/*
const chunk1Raw = [
  { "العبارة": "أَمِّي طبيبة.", "الخطأ": "...", "التصحيح": "أَمِّي طبيبة." },           // no-op -> dropped
  { "العبارة": "هاذا الجامعت كبير", "الخطأ": "...", "التصحيح": "هذا الجامعت كبير" }, // leaked -> flagged
];

const result1 = checkRecommendations(chunk1Raw);
console.log(result1.stats); // { total: 2, noOp: 1, leaked: 1, malformed: 0, clean: 0 }

// After collecting all chunks:
const finalResult = mergeChunkResults([result1, result2Etc]);
*/

export { checkRecommendations, mergeChunkResults };
