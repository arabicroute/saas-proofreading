import type { FeatureConfig } from "../types/featureConfig";

// This layer is ALWAYS appended last, even in override mode.
// It encodes the contract the parser + consistency-check depend on.
// It must never be user-overridable.
export const STRUCTURAL_PROMPT_LAYER = `
بصرف النظر عن أي تعليمات أخرى، يجب الالتزام بالتنسيق والقواعد البنيوية التالية دون أي استثناء:
- أخرج النتائج بصيغة JSON بالشكل التالي حصراً: { "التوصيات": [ { "العبارة": "...", "الخطأ": "...", "التصحيح": "..." } ] }
- "العبارة" يجب أن تكون نسخة طبق الأصل من النص الأصلي.
- إذا لم تجد أي أخطاء أخرج: { "التوصيات": [] }
- لا تُخرج أي نص خارج كائن JSON.
`.trim();


export const TESTING_DEFAULTS: FeatureConfig = {
  tier: "testing",
  modelId: "command-r7b-arabic-02-2025",
  maxChunkChars: 2000,      // ~500 tokens per chunk
  maxOutputTokens: 4000,    // Cohere model cap
  multiTurn: true,
  requestsPerMinute: 20,    // Cohere trial hard limit
  monthlyCallCeiling: 1000, // Cohere trial hard limit
  customInstructionsMode: "additive",
  customInstructions: "",
  temperature: 0.4,         // empirically found floor from testing
  seed: 42,
  thinkingDisabled: true,
};

export const PRODUCTION_DEFAULTS: FeatureConfig = {
  tier: "production",
  modelId: "command-r7b-arabic-02-2025",
  maxChunkChars: 4000,
  maxOutputTokens: 4000,
  multiTurn: true,
  requestsPerMinute: Infinity, // no client-side throttle in production
  monthlyCallCeiling: null,    // server-enforced, not client-tracked
  customInstructionsMode: "additive",
  customInstructions: "",
  temperature: 0.4,
  seed: 42,
  thinkingDisabled: true,
};

// Fields a production-tier user may still adjust.
// Everything else stays locked to the production defaults.
export const PRODUCTION_EDITABLE_FIELDS: ReadonlyArray<keyof FeatureConfig> = [
  "customInstructions",
  "customInstructionsMode",
];

export function isFeatureConfigFieldEditable(
  tier: FeatureConfig["tier"],
  field: keyof FeatureConfig
): boolean {
  return tier !== "production" || PRODUCTION_EDITABLE_FIELDS.includes(field);
}

export const AVAILABLE_MODELS: Array<{ id: FeatureConfig["modelId"]; label: string }> = [
  { id: "command-r7b-arabic-02-2025", label: "Command R7B Arabic (default)" },
  { id: "command-a-plus-05-2026",     label: "Command A+ (May 2026)"        },
];
