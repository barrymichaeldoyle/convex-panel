import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/convex-inspect/" : "/",
  resolve: {
    alias: {
      "convex-inspect/react": fileURLToPath(new URL("../../packages/core/src/react.tsx", import.meta.url)),
      "convex-inspect$": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
    },
  },
}));
