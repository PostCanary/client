import { test, expect } from "@playwright/test";

/**
 * Sprint 1.0.4 — Emma persona regression guard.
 *
 * Emma is the existing PostCanary analytics customer (4+ months active,
 * 12+ uploaded campaigns, daily Dashboard + Heatmap user). Her test:
 * "Did anything change? Is my data still there? Does this new thing
 * break what I've been using?" (postcanary.md persona definition).
 *
 * This spec walks Emma's daily-driver pages and asserts (a) authenticated
 * access works, (b) prior campaign data is visible (NOT empty-state),
 * (c) no regression markers (paywall blocking, error overlays, auth wall).
 *
 * Targets the Docker stack on :8080 (nginx -> Flask api -> Vite via HMR)
 * because that's where session cookies from auth.setup.ts work — :5175
 * vite-only would show login screens instead of authenticated views.
 *
 * Reuses .auth/live.json from auth.setup.ts (run that first if missing).
 */

test.use({
  baseURL: "http://localhost:8080",
  storageState: ".auth/live.json",
});

const EMMA_PAGES: Array<{
  path: string;
  title: RegExp;
  dataSelector: string;
  emptyStateMarker: RegExp;
}> = [
  {
    path: "/app/dashboard",
    title: /Dashboard/i,
    dataSelector: "main :is(h1, h2, h3, [data-testid])",
    emptyStateMarker: /No campaigns yet|Get started by creating|Welcome to PostCanary/i,
  },
  {
    path: "/app/map",
    title: /Map|Heatmap/i,
    dataSelector: "main :is(canvas, svg, [data-testid='heatmap-layer'], .leaflet-container)",
    emptyStateMarker: /No data to display|Upload a campaign first|Map will appear/i,
  },
  {
    path: "/app/history",
    title: /History/i,
    dataSelector: "main :is([data-testid='history-row'], tbody tr, .campaign-card, article)",
    emptyStateMarker: /No campaigns yet|Your history is empty|Get started/i,
  },
];

test.describe("Emma regression — existing-customer daily-driver paths", () => {
  for (const { path, title, dataSelector, emptyStateMarker } of EMMA_PAGES) {
    test(`Emma daily driver renders with data: ${path}`, async ({ page }, testInfo) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle", { timeout: 25_000 });

      // 1. Authenticated landing — NOT bounced to login.
      await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/")), {
        timeout: 5_000,
      });

      // 2. Document title matches Emma's expected page label.
      const pageTitle = await page.title();
      expect(pageTitle, `document.title for ${path}`).toMatch(title);

      // 3. Real content rendered (not skeleton/spinner state).
      const dataLocator = page.locator(dataSelector);
      const dataCount = await dataLocator.count();
      expect(
        dataCount,
        `${path} should render real content for Emma's existing data; found ${dataCount}`,
      ).toBeGreaterThanOrEqual(1);

      // 4. NO empty-state copy visible — Emma is an existing customer.
      // If this fires, either Emma's data was wiped OR the page is rendering
      // the new-user variant for an existing user (regression for persona).
      await expect(
        page.getByText(emptyStateMarker),
        `${path} showed empty-state copy for Emma (existing customer with prior campaigns)`,
      ).not.toBeVisible();

      // 5. NO paywall blocking access — Emma's subscription is active.
      await expect(
        page.getByText(/Unlock Matching|Upgrade to access|Subscribe to continue/i),
        `${path} blocked Emma with paywall — subscription regression`,
      ).not.toBeVisible();

      // 6. NO runtime error overlay.
      await expect(
        page.getByText(/Something went wrong|Uncaught|Fatal error|Application error/i),
        `${path} surfaced runtime error overlay`,
      ).not.toBeVisible();

      // 7. Full-page screenshot for Drake's visual review on failure.
      await page.screenshot({
        path: testInfo.outputPath(`emma_${path.replace(/\//g, "_")}.png`),
        fullPage: true,
      });
    });
  }

  test("Emma sees her campaign count on Dashboard (sanity)", async ({ page }) => {
    await page.goto("/app/dashboard");
    await page.waitForLoadState("networkidle", { timeout: 25_000 });

    // Emma has 12+ historical campaigns per persona definition. We don't
    // assert exact count (test data drifts) but the Dashboard should
    // surface SOMETHING numeric/quantitative for her prior activity —
    // a campaign list, a count badge, a stats card, or a chart.
    const quantitativeContent = page.locator(
      "main :is([data-testid*='count'], [data-testid*='campaign'], .stat-card, .campaign-card, [class*='count'], canvas, svg)",
    );
    const found = await quantitativeContent.count();
    expect(
      found,
      "Dashboard should surface Emma's prior campaign activity (count, list, chart, or stats card)",
    ).toBeGreaterThanOrEqual(1);
  });
});
