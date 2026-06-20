// Stub for Phase 5 item 16: re-verify the 0.4 temperature floor.
// Run this from the Playground tab's test runner with the temperatures below.

/**
 * Temperature values to re-test empirically before locking production defaults.
 * The 0.4 floor was observed across a small number of Playground runs —
 * confirm it's a real model constraint rather than test-run artifact.
 *
 * Suggested test procedure:
 *   1. Use the same 2-3 representative Arabic text samples each time.
 *   2. Run each temperature 3 times (seed varies: 42, 43, 44).
 *   3. Grade output on: valid JSON, correct field structure, error accuracy.
 *   4. Update TESTING_DEFAULTS.temperature if 0.1 or 0.2 prove stable.
 */
export const TEMPERATURE_TEST_VALUES = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5] as const;
