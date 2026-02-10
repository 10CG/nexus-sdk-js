import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "examples/**",
        "src/index.ts",
        "src/errors/index.ts",
        "src/services/index.ts",
      ],
    },
  },
});
