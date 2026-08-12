import { defineConfig, devices } from "@playwright/test";

import baseConfig from "./playwright.config";

export default defineConfig({
  ...baseConfig,
  testMatch: [
    "organizations.spec.ts",
    "core-features.spec.ts",
    "approval-artifact-flow.spec.ts",
    "campaign-detail-flow-v2.spec.ts",
    "release-accessibility.spec.ts",
  ],
  grep: /invite accept page prompts unauthenticated users|org switcher reloads the app|dashboard upload-and-match flow|settings exposes billing controls|keeps POS-170 draft badges synchronized|durable order counts and server amounts|release accessibility|keyboard navigation reaches and activates/,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never", outputFolder: "playwright-report-release" }]]
    : [["list"], ["html", { open: "never", outputFolder: "playwright-report-release" }]],
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
