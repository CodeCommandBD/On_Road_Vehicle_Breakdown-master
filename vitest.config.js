import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: "jsdom",

    // Setup files
    setupFiles: ["./vitest.setup.js"],

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "coverage/",
        "**/*.config.js",
        "**/*.config.ts",
      ],
      // Coverage thresholds
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70,
    },

    // Test match patterns
    include: [
      "**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "**/*.{test,spec}.{js,jsx,ts,tsx}",
    ],

    // Exclude patterns
    exclude: ["node_modules", ".next", "dist", "build"],
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
