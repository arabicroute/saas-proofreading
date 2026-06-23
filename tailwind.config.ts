
// tailwind.config.ts
// ─────────────────────────────────────────────────────────────────
// Tailwind v4 does NOT use this file for tokens (those live in
// @theme {} in index.css). This file is kept only for the
// hoverOnlyWhenSupported future flag, which is still valid in v4.
//
// The "content" array is not needed in v4 — the vite plugin
// (@tailwindcss/vite) handles content detection automatically via
// the module graph. Keeping it causes no harm but it is inert.
// ─────────────────────────────────────────────────────────────────
import type { Config } from "tailwindcss";

export default {
  // v4: content scanning is handled by @tailwindcss/vite — safe to omit.
  // Kept here as a no-op comment anchor for future explicit overrides.
  future: { hoverOnlyWhenSupported: true },
} satisfies Config;
