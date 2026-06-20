import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**\/*.{ts,tsx}"],
  // Enable RTL variant support (rtl: prefix on utility classes)
  future: { hoverOnlyWhenSupported: true },
} satisfies Config;
