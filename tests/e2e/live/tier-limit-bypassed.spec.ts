import { test, expect } from "@playwright/test";

/**
 * S69 — after Drake uploaded 1,300 mail records + ran matching, he hit
 * the "Upgrade required" modal (usage 2,596 > INSIGHT tier's 1,000
 * limit). Bumped him to ELITE (100,000 mailers) via DB patch. This
 * spec confirms the tier-limit modal does NOT render on Dashboard post
 * upload+match, AND the original is_subscribed paywall also stays
 * cleared (both gates bypassed).
 *
 * Related: paywall-bypassed.spec.ts (is_subscribed gate).
 * This spec covers the DIFFERENT gate — tier mail-volume limit.
 */

test.use({
  baseURL: "http://localhost:8080",
  storageState: ".auth/live.json",
});

test("dashboard — no Upgrade required tier-limit modal", async ({ page }) => {
  await page.goto("/app/dashboard");
  await page.waitForLoadState("networkidle", { timeout: 15_000 });

  // Neither paywall modal should be visible.
  await expect(page.getByText(/Upgrade required/i)).not.toBeVisible();
  await expect(page.getByText(/Unlock Matching/i)).not.toBeVisible();
  await expect(page.getByText(/You've reached your monthly mail volume/i)).not.toBeVisible();
});
