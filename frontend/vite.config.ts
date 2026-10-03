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
  // host: true listens on IPv4 (127.0.0.1) and IPv6 (::1), so "localhost" works in every browser on Windows
  server: {
    port: 5173,
    host: true,
    // send /api calls to the FastAPI backend (backend/), so the browser sees one origin and the refresh cookie works
    proxy: { "/api": "http://localhost:8000" },
  },
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
