import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for LIVE dev-stack tests.
 *
 * Targets http://localhost:8080 (nginx-proxied dev stack). No mock API. The
 * PostCanary dev stack must be running before invoking:
 *   cd ~/postcanary/server
 *   docker compose -f docker-compose.dev.yml -f docker-compose.render-worker.dev.yml \
 *     --env-file .env.dev --profile client up -d
 *
 * This complements the mock-API config at playwright.config.ts (which covers
 * the legacy dashboard/analytics flow). Use the live config for any spec that
 * must verify real pipeline behavior — photo rendering, preview-card endpoint,
 * brand kit state, Desert Diamond demo protection.
 */
export default defineConfig({
  testDir: "./tests/e2e/live",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report-live" }],
  ],
  outputDir: "test-results-live",
  timeout: 480_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: "http://localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "live-chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/live.json",
      },
      dependencies: ["setup"],
    },
  ],
});
