import { cpSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Two builds from the same code:
//  - web (default): served by the website at /app, built into ../public/app
//  - native (`--mode native`): the iPhone app, built into dist/ for Capacitor, talking to VITE_API_BASE
export default defineConfig(({ mode }) => {
  const native = mode === "native";
  return {
    base: native ? "/" : "/app/",
    plugins: [
      react(),
      // The Resource Center tools live in the website's public/tools. The iPhone app has no server
      // to load them from, so the native build bundles a copy at the same path.
      { name: "beacon-tools", closeBundle() { if (native) cpSync("../public/tools", "dist/tools", { recursive: true }); } },
    ],
    build: { outDir: native ? "dist" : "../public/app", emptyOutDir: true, chunkSizeWarningLimit: 1500 },
    server: { port: 8100, proxy: { "/api": "http://localhost:3100", "/tools": "http://localhost:3100", "/brand": "http://localhost:3100" } },
  };
});
