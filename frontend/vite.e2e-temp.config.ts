import { defineConfig, mergeConfig } from "vite";
import base from "./vite.config";

export default mergeConfig(base, defineConfig({ server: { port: 5175, proxy: { "/api": "http://localhost:8001" } } }), false);
