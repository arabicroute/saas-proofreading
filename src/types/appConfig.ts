export type KeySlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface AppConfig {
  defaultKeySlot: KeySlot;
  locale?: string;
}
