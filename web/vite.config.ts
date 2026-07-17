import { defineConfig } from "vite";

// Relative base + relative asset paths so the built site works when hosted
// under a subpath (apps.charliekrug.com/planscope), not just at a domain root.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
  },
  test: {
    environment: "jsdom",
  },
});
