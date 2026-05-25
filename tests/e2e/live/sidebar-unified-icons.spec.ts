import { test, expect } from "@playwright/test";

/**
 * S69 — sidebar icons are now all Ionicons5 components (inline SVG with
 * currentColor). Previously some sidebar items used `<img src="*.svg">`
 * with hardcoded `fill="#0C2D50"`, producing the teal-vs-navy mismatch
 * Drake caught. This spec guards the uniform-color invariant: no `<img>`
 * inside a sidebar-item button.
 *
 * If this fails: someone re-imported a `?url` SVG asset into
 * AppSidebar.vue. Replace with an Ionicons5 component import.
 */

test.use({
  baseURL: "http://localhost:8080",
  storageState: ".auth/live.json",
});

test("sidebar renders all icons as inline SVG (no <img src> icons)", async ({ page }, testInfo) => {
  await page.goto("/app/home");
  await page.waitForLoadState("networkidle", { timeout: 15_000 });

  // Every sidebar-item should have an inline <svg>, zero <img> icons.
  const itemImgCount = await page.locator(".sidebar-item img.item-icon").count();
  expect(itemImgCount, "no <img> icons inside sidebar items").toBe(0);

  const itemSvgCount = await page.locator(".sidebar-item svg.item-icon").count();
  expect(itemSvgCount, "inline SVG icons present in sidebar items").toBeGreaterThanOrEqual(9);

  // Visual regression reference — save a screenshot of the sidebar for
  // human review before/after future icon changes.
  await page.locator(".app-sidebar").screenshot({
    path: testInfo.outputPath("sidebar.png"),
  });
});
