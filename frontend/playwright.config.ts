import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests. The webServer boots `next start` against a production
 * build with the API proxy pointed at a mock backend (see e2e/mock-backend.ts),
 * so the suite never touches Render and runs the same in CI.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:3210",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run e2e:serve",
    url: "http://127.0.0.1:3210/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
