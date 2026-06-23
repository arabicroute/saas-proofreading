import type { KeySlot } from "../types/appConfig";

export interface KeyOption {
  slot: KeySlot;
  label: string;
  value: string;
}

function sanitizeLabel(labelRaw: string, slot: number, value: string): string {
  const label = labelRaw.trim();
  if (!label) return `Key ${slot}`;

  const valueTrimmed = value.trim();
  if (valueTrimmed && label === valueTrimmed) return `Key ${slot}`;

  if (/^co-[A-Za-z0-9_-]{10,}$/.test(label)) return `Key ${slot}`;
  if (label.length >= 40 && !/\s/.test(label)) return `Key ${slot}`;

  return label;
}

export const KEY_OPTIONS: KeyOption[] = (() => {
  const options: KeyOption[] = [];

  for (let slot = 1; slot <= 10; slot += 1) {
    const value = (import.meta.env[`VITE_COHERE_API_KEY_${slot}`] as string | undefined) ?? "";
    if (!value.trim()) continue;

    const configuredLabel =
      (import.meta.env[`VITE_COHERE_API_KEY_LABEL_${slot}`] as string | undefined) ?? "";

    options.push({
      slot: slot as KeySlot,
      label: sanitizeLabel(configuredLabel, slot, value),
      value,
    });
  }

  const legacyKey = (import.meta.env.VITE_COHERE_API_KEY as string | undefined) ?? "";
  const hasSlot1 = options.some((option) => option.slot === 1);
  if (!hasSlot1 && legacyKey.trim()) {
    const configuredLabel = (import.meta.env.VITE_COHERE_API_KEY_LABEL_1 as string | undefined) ?? "";
    options.unshift({
      slot: 1,
      label: sanitizeLabel(configuredLabel, 1, legacyKey),
      value: legacyKey,
    });
  }

  return options;
})();

export function getKeyBySlot(slot: KeySlot): KeyOption | undefined {
  return KEY_OPTIONS.find((option) => option.slot === slot);
}

export function resolveInitialApiKey(defaultSlot: KeySlot): string {
  const preferred = getKeyBySlot(defaultSlot);
  if (preferred) return preferred.value;

  if (KEY_OPTIONS.length > 0) return KEY_OPTIONS[0].value;
  return import.meta.env.VITE_COHERE_API_KEY ?? "";
}

export function resolveInitialKeySlot(defaultSlot: KeySlot): KeySlot | null {
  const preferred = getKeyBySlot(defaultSlot);
  if (preferred) return preferred.slot;

  return KEY_OPTIONS[0]?.slot ?? null;
}
