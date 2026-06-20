import { STRUCTURAL_PROMPT_LAYER } from "../config/featureConfig";
import type { FeatureConfig } from "../types/featureConfig";
import type { CohereMessage } from "../types/cohere";
import { wrapChunk } from "./chunker";

// Reads the system prompt at build time via Vite's ?raw import.
// The file lives at src/prompts/systemPrompt.ar.md.
// In dev mode, the Playground editor can override this in-memory.
import rawSystemPrompt from "../prompts/systemPrompt.ar.md?raw";

export function getSystemPrompt(): string {
  return rawSystemPrompt;
}

/**
 * Assembles the final system prompt string from:
 *   1. The base editorial-layer prompt (from the .md file or dev override)
 *   2. User custom instructions (additive: appended; override: replaces editorial layer)
 *   3. The structural layer (always last, never overridable)
 */
export function assembleSystemPrompt(
  cfg: FeatureConfig,
  editorialOverride?: string  // supplied by Playground in dev mode
): string {
  const editorial = editorialOverride ?? rawSystemPrompt;

  if (cfg.customInstructionsMode === "override" && cfg.customInstructions.trim()) {
    // Replace the editorial layer with user instructions,
    // but always append the structural layer last.
    return [
      cfg.customInstructions.trim(),
      STRUCTURAL_PROMPT_LAYER,
    ].join("\n\n---\n\n");
  }

  if (cfg.customInstructionsMode === "additive" && cfg.customInstructions.trim()) {
    return [
      editorial,
      `تعليمات إضافية من المستخدم (طبّقها بما يتوافق مع القواعد أعلاه، دون مخالفتها):\n${cfg.customInstructions.trim()}`,
      STRUCTURAL_PROMPT_LAYER,
    ].join("\n\n---\n\n");
  }

  // "none" mode — base prompt + structural layer only
  return [editorial, STRUCTURAL_PROMPT_LAYER].join("\n\n---\n\n");
}

/**
 * Builds the full messages array for a multi-turn chunked session.
 *
 * Turn 1  →  system + user(chunk1)
 * Turn N  →  ...accumulated history... + user(chunkN)
 *
 * Each chunk is wrapped in === المقطع الحالي === delimiters so the model
 * has an unambiguous boundary when the conversation history accumulates.
 */
export function buildMultiTurnMessages(
  chunks: string[],
  currentChunkIndex: number,
  history: CohereMessage[],  // accumulated from previous turns in this session
  systemPrompt: string,
  isFirstChunk: boolean
): CohereMessage[] {
  const chunkInstruction =
    currentChunkIndex === 0
      ? "دقّق المقطع التالي بحثاً عن جميع الأخطاء اللغوية:"
      : "دقّق المقطع التالي بحثاً عن جميع الأخطاء اللغوية. لا تُعِد ذكر أي خطأ ورد في مقطع سابق:";

  const userMessage: CohereMessage = {
    role: "user",
    content: `${chunkInstruction}\n\n${wrapChunk(chunks[currentChunkIndex])}`,
  };

  if (isFirstChunk) {
    return [
      { role: "system", content: systemPrompt },
      userMessage,
    ];
  }

  // Subsequent turns: re-send history (system already in position 0) + new user turn
  return [...history, userMessage];
}

/**
 * Stateless (non-multi-turn) variant — each chunk is a fresh conversation.
 */
export function buildStatelessMessages(
  chunk: string,
  systemPrompt: string
): CohereMessage[] {
  return [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `دقّق المقطع التالي بحثاً عن جميع الأخطاء اللغوية:\n\n${wrapChunk(chunk)}`,
    },
  ];
}
