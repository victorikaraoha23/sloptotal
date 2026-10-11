import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Unit-test config. Next.js pages/components import via the `@/` alias, so we
 * mirror tsconfig paths here. jsdom + Testing Library for component tests.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e/**"],
  },
});
