export type PlanTier = "testing" | "production";
export type CustomInstructionsMode = "none" | "additive" | "override";
export type ModelId =
  | "command-r7b-arabic-02-2025"
  | "command-a-plus-05-2026";

export interface FeatureConfig {
  // ── Plan tier ──────────────────────────────────────────────────────────────
  tier: PlanTier;

  // ── Model ──────────────────────────────────────────────────────────────────
  modelId: ModelId;

  // ── Input/output limits ────────────────────────────────────────────────────
  // Max characters per chunk sent to the model.
  // A rough token estimate is charLimit / 4.
  maxChunkChars: number;
  // Max tokens the model may emit per response (Cohere cap: 4000).
  maxOutputTokens: number;

  // ── Multi-turn ─────────────────────────────────────────────────────────────
  // When true, chunks are sent as sequential turns in one conversation.
  // When false, each chunk is an independent stateless call.
  multiTurn: boolean;

  // ── Rate limiting ──────────────────────────────────────────────────────────
  // Max requests per minute (enforced client-side in Testing tier).
  requestsPerMinute: number;
  // Monthly call ceiling (trial: 1000, production: determined by plan).
  monthlyCallCeiling: number | null; // null = unlimited

  // ── System prompt / custom instructions ───────────────────────────────────
  customInstructionsMode: CustomInstructionsMode;
  // Only used when mode is 'additive' or 'override'.
  customInstructions: string;

  // ── Model inference params ─────────────────────────────────────────────────
  temperature: number;
  seed: number;
  thinkingDisabled: boolean;
}
