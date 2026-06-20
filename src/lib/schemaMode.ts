// Stub for Phase 5 item 17: validate Arabic-keyed JSON Schema mode vs real API.
// The schema that partially worked in the Playground UI is preserved here.
// Wire it into cohereClient.ts once confirmed against the real API.

/**
 * Arabic-keyed JSON Schema that was accepted by the Cohere Playground UI
 * (omitting top-level "type" keys on container nodes, per UI quirk).
 *
 * OPEN QUESTION: Does the real /v2/chat API require the fuller wrapper shape
 * even when the Playground field doesn't enforce it?
 * Test with: response_format: { type: "json_object", schema: ARABIC_SCHEMA }
 */
export const ARABIC_SCHEMA = {
  properties: {
    التوصيات: {
      items: {
        properties: {
          العبارة:  { type: "string" },
          الخطأ:   { type: "string" },
          التصحيح: { type: "string" },
        },
        required: ["العبارة", "الخطأ", "التصحيح"],
      },
    },
  },
  required: ["التوصيات"],
};

// To test, add `schema: ARABIC_SCHEMA` inside `response_format` in cohereClient.ts:
// response_format: { type: "json_object", schema: ARABIC_SCHEMA }
// and observe whether output quality holds vs JSON-mode-no-schema.
