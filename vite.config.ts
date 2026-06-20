import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devServerPort = env.DEV_SERVER_PORT || "3001";
  const isLaragonBuild = mode === "laragon";

  return {
    base: isLaragonBuild ? "/dist/" : "/",
    plugins: [react(), tailwindcss()],
    // Proxy /api/* to the local Express dev server during development.
    // In production this block is irrelevant since the Express server
    // becomes the real backend proxy holding the Cohere key server-side.
    server: {
      proxy: {
        "/api": {
          target: `http://localhost:${devServerPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
