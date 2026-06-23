import type { AppConfig, KeySlot } from "../types/appConfig";

function parseDefaultKeySlot(): KeySlot {
  const raw = import.meta.env.VITE_APP_DEFAULT_KEY_SLOT;
  const parsed = Number.parseInt(raw ?? "", 10);

  if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 10) {
    return parsed as KeySlot;
  }

  return 1;
}

export const APP_CONFIG: AppConfig = {
  defaultKeySlot: parseDefaultKeySlot(),
};
