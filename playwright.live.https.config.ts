import { defineConfig, devices } from "@playwright/test";

/**
 * Live config variant for the local HTTPS smoke proxy
 * (https://127.0.0.1:5443 — self-signed cert fronting the built SPA +
 * the feature-mail API on one origin). The Secure / SameSite=None session
 * cookie requires a secure context, so the plain-http listener can't
 * carry an authenticated browser session.
 */
const liveBaseURL = process.env.E2E_LIVE_BASE_URL ?? "https://127.0.0.1:5443";

export default defineConfig({
  testDir: "./tests/e2e/live",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report-live" }],
  ],
  outputDir: "test-results-live",
  timeout: 480_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: liveBaseURL,
    ignoreHTTPSErrors: true,
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
        ignoreHTTPSErrors: true,
      },
      dependencies: ["setup"],
    },
  ],
});
