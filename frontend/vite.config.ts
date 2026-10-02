/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // keep heavy, rarely-changing libraries in their own cacheable chunks
        manualChunks: {
          react: ["react", "react-dom", "react-dom/client", "react-router"],
          charts: ["recharts"],
          markdown: ["react-markdown", "rehype-sanitize"],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
