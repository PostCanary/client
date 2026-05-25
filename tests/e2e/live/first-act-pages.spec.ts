import { test, expect } from "@playwright/test";

/**
 * S69 first-act demo dry-run — walks Dashboard, Map, Analysis, Audience,
 * History. Captures a screenshot of each and asserts (a) the page title
 * matches the expected label, (b) at least one non-skeleton DOM element
 * renders. Blank-state detection: if all three pages show "No data yet"
 * or similar empty states, Drake's first-act demo falls flat.
 *
 * This is a DRY-RUN spec, not a strict regression guard — it flags
 * obvious broken states but doesn't assert specific content that could
 * drift between demos.
 */

test.use({
  baseURL: "http://localhost:8080",
  storageState: ".auth/live.json",
});

const PAGES: Array<{ path: string; title: RegExp }> = [
  { path: "/app/dashboard", title: /Dashboard/i },
  { path: "/app/map", title: /Map|Heatmap/i },
  { path: "/app/analytics", title: /Analytics|Analysis/i },
  { path: "/app/demographics", title: /Demographics|Audience/i },
  { path: "/app/history", title: /History/i },
];

for (const { path, title } of PAGES) {
  test(`first-act page renders: ${path}`, async ({ page }, testInfo) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle", { timeout: 20_000 });

    // Page title matches (topbar or document title)
    const pageTitle = await page.title();
    expect(pageTitle, `document.title for ${path}`).toMatch(title);

    // Something other than skeleton/spinner is present. Skeleton loaders
    // usually have a `.skeleton` or `.animate-pulse` class. Real content
    // has meaningful text or images.
    const realContent = await page
      .locator("main :is(h1, h2, h3, button, a, img, [data-testid]):not(.skeleton):not(.animate-pulse)")
      .count();
    expect(
      realContent,
      `${path} should have >=3 rendered content elements`,
    ).toBeGreaterThanOrEqual(3);

    // No paywall modal in the way (Drake's subscription is active —
    // spec confirms we didn't regress paywall bypass)
    await expect(page.getByText(/Unlock Matching/i)).not.toBeVisible();

    // No uncaught error overlay / runtime error UI
    await expect(page.getByText(/Something went wrong|Uncaught|Fatal error/i)).not.toBeVisible();

    // Full-page screenshot for Drake's visual review
    await page.screenshot({
      path: testInfo.outputPath(`${path.replace(/\//g, "_")}.png`),
      fullPage: true,
    });
  });
}
