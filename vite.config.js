import react from "@vitejs/plugin-react";
import { join } from "node:path";
import { defineConfig, loadEnv } from "vite";
import { raidsPlugin } from "./server/raids.js";
import { createStore, xAuthPlugin } from "./server/xAuth.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const store = createStore(join(process.cwd(), "data"));
  return {
    plugins: [react(), xAuthPlugin(env, store), raidsPlugin(env, store)],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
    },
  };
});
