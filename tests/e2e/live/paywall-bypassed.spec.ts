import { test, expect } from "@playwright/test";

/**
 * S69 verify-before-showing-drake guard — after DB-patching the dev org's
 * subscription to status=active, confirms the PaywallModal ("Unlock
 * Matching") does NOT render on the pages that gate off is_subscribed:
 * Dashboard, Map, Analysis, Audience, History.
 *
 * Written after the Stop hook caught me telling Drake to manually refresh
 * without client-level verification (mem 565). curl /auth/me confirmed the
 * API layer returns is_subscribed=true, but the user-visible gate UI is at
 * layer 3 — only a Playwright walk proves that layer.
 *
 * If this spec fails: the subscription row update didn't propagate to the
 * client for some reason (cache, /auth/me not re-fetched, useBilling watch
 * race). Re-run after hard-refresh OR investigate the useBilling flow.
 */

test.use({
  baseURL: "http://localhost:8080",
  storageState: ".auth/live.json",
});

const PAYWALL_HEADING = /Unlock Matching|Choose a plan|Start subscription/i;

test.describe("Paywall bypassed on results pages (live stack)", () => {
  for (const path of [
    "/app/dashboard",
    "/app/map",
    "/app/analysis",
    "/app/audience",
    "/app/history",
  ]) {
    test(`${path} — no paywall modal`, async ({ page }) => {
      await page.goto(path);
      // Give the page a beat to hydrate auth + billing state + render any
      // gated modal. If the modal was going to show, it would be in the
      // DOM by now.
      await page.waitForLoadState("networkidle", { timeout: 15_000 });
      await expect(page.getByText(PAYWALL_HEADING)).not.toBeVisible();
    });
  }
});
