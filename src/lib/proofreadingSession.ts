// Orchestrates the full proofreading run:
//   split → [rate-limit → call → consistency-check → accumulate] → merge
// Emits progress events via a callback so the UI can update reactively.

import { splitIntoChunks } from "./chunker";
import { assembleSystemPrompt, buildMultiTurnMessages, buildStatelessMessages } from "./promptAssembler";
import { callCohere } from "./cohereClient";
import { checkRecommendations, mergeChunkResults } from "./consistencyCheck";
import { RateLimiter } from "./rateLimiter";
import { incrementMonthlyUsage } from "./usageCounter";
import type { FeatureConfig } from "../types/featureConfig";
import type { ChunkResult, MergedResult } from "../types/recommendation";
import type { CohereMessage } from "../types/cohere";

export type ChunkStatus = "pending" | "running" | "done" | "error";

export interface ChunkProgress {
  index: number;
  total: number;
  status: ChunkStatus;
  errorMessage?: string;
}

export interface SessionOptions {
  text: string;
  apiKey: string;
  cfg: FeatureConfig;
  promptOverride?: string; // dev Playground: in-memory edited prompt
  onProgress: (p: ChunkProgress) => void;
}

export interface SessionResult {
  merged: MergedResult;
  aborted: boolean;
  abortReason?: string;
}

export async function runProofreadingSession(
  opts: SessionOptions
): Promise<SessionResult> {
  const { text, apiKey, cfg, promptOverride, onProgress } = opts;

  const chunks     = splitIntoChunks(text, cfg.maxChunkChars);
  const systemPrompt = assembleSystemPrompt(cfg, promptOverride);
  const limiter    = new RateLimiter(cfg.requestsPerMinute);
  const history: CohereMessage[] = [];
  const chunkResults: ChunkResult[] = [];

  let aborted = false;
  let abortReason: string | undefined;

  for (let i = 0; i < chunks.length; i++) {
    onProgress({ index: i, total: chunks.length, status: "running" });

    // Rate-limit slot acquisition (no-op if tier === production / Infinity rpm)
    if (isFinite(cfg.requestsPerMinute)) {
      await limiter.acquireSlot();
    }

    const messages = cfg.multiTurn
      ? buildMultiTurnMessages(chunks, i, history, systemPrompt, i === 0)
      : buildStatelessMessages(chunks[i], systemPrompt);

    try {
      const raw = await callCohere(messages, cfg, apiKey);
      incrementMonthlyUsage();

      // Accumulate history for multi-turn (assistant reply appended)
      if (cfg.multiTurn) {
        const assistantText = JSON.stringify(raw);
        history.push(...messages.slice(history.length)); // new user turn(s)
        history.push({ role: "assistant", content: assistantText });
      }

      const checked = checkRecommendations(raw.التوصيات);
      chunkResults.push(checked);
      onProgress({ index: i, total: chunks.length, status: "done" });

    } catch (err: unknown) {
      const e = err as { isRateLimit?: boolean; retryAfterSecs?: number | null; message?: string };
      onProgress({ index: i, total: chunks.length, status: "error", errorMessage: e.message });

      if (e.isRateLimit) {
        aborted     = true;
        abortReason = `Rate limit hit on chunk ${i + 1}/${chunks.length}. Remaining chunks skipped.`;
        // Mark remaining chunks as pending-skipped
        for (let j = i + 1; j < chunks.length; j++) {
          onProgress({ index: j, total: chunks.length, status: "error", errorMessage: "Skipped due to rate limit" });
        }
        break;
      }
      // Non-rate-limit error: push empty result, continue to next chunk
      chunkResults.push({ clean: [], flagged: [], stats: { total: 0, noOp: 0, leaked: 0, malformed: 0, clean: 0 } });
    }
  }

  return {
    merged: mergeChunkResults(chunkResults),
    aborted,
    abortReason,
  };
}
