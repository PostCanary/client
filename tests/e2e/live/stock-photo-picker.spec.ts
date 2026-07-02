import { test, expect, type Page } from "@playwright/test";

/**
 * Session 61 Bug #3 regression — stock photos in Change Photo picker.
 *
 * Before S61: src/data/stockPhotos.ts shipped 15 Unsplash URLs. The
 * render_worker url_guard allowlist does not include unsplash.com, so
 * selecting a stock option triggered PHOTO_BLOCKED_BY_URL_GUARD and the
 * preview silently kept the previous photo (warning only in console).
 *
 * Fix (Option A, S60 catalog): emptied PHOTOS array in stockPhotos.ts.
 * Picker now only surfaces brand-kit photos. This test asserts the
 * silent-failure path is removed: zero picker options carry
 * data-source="stock".
 *
 * If stock options are re-introduced post-demo via /media/stock/... local
 * URLs allowlisted by url_guard, this test should stay green (those URLs
 * won't trigger PHOTO_BLOCKED_BY_URL_GUARD). If Unsplash URLs sneak back
 * in, this test catches it.
 */

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;

async function navigateToStep3(page: Page) {
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/app/send");
  await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });

  await page
    .getByRole("button", { name: /Recommended\s+Neighbor Marketing/i })
    .click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const step3 = page.getByRole("button", { name: /(?:3\s+)?Your Postcard/ });
  await expect(step3).toBeEnabled({ timeout: 30_000 });
  await step3.click();

  await expect(
    page.getByText("Your 3-card sequence — same branding, different messaging"),
  ).toBeVisible({ timeout: 30_000 });
}

test.describe("stock photo picker — live stack", () => {
  test("Change Photo picker does not surface url_guard-blocked stock photos", async ({
    page,
  }) => {
    await navigateToStep3(page);
    await page.getByTestId("edit-photo-toggle").click();

    const stockOptions = page.locator('[data-testid^="photo-option-"][data-source="stock"]');
    await expect(
      stockOptions,
      "Change Photo picker must not surface stock photos whose URLs are blocked server-side (S61 Bug #3)",
    ).toHaveCount(0);

    // Sanity: at least one brand option should be visible (picker still works).
    const brandOptions = page.locator('[data-testid^="photo-option-"][data-source="brand"]');
    await expect(
      brandOptions,
      "picker should still show brand photos from the brand kit",
    ).not.toHaveCount(0);
  });
});
