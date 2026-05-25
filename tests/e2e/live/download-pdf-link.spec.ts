import { test, expect } from "@playwright/test";

/**
 * Regression guard for the Download PDF link in Step 3's proof panel.
 *
 * Current behavior (S62 rehearsal finding): the Download PDF anchor is
 * hardcoded to `renderedCards[0]?.downloadUrl` at
 * `src/components/wizard/StepDesign.vue:362-367`. It's a known UX gap —
 * per-card selection is queued as post-demo work. This spec does NOT
 * assert per-card behavior; it asserts the single download link exists
 * and points at a signed render-job URL so we catch silent regressions
 * in the render-job → UI wiring if future work refactors the flow.
 *
 * When per-card selection ships post-demo, this spec should be extended
 * (or replaced) with per-card-link assertions.
 */

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;
const DOWNLOAD_URL_RE = /\/api\/render-jobs\/[0-9a-f-]{36}\/cards\/\d+\?sig=[a-f0-9]+&exp=\d+/;

test.describe("download pdf link — live stack", () => {
  test(
    "after Generate Proof, Download PDF link is present with signed render-job URL",
    async ({ page }) => {
      await page.goto("/app/send");
      await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });

      await page
        .getByRole("button", { name: /Recommended\s+Neighbor Marketing/i })
        .click();
      await page.getByRole("button", { name: "Next", exact: true }).click();

      const step3Btn = page.getByRole("button", { name: /(?:3\s+)?Your Postcard/ });
      await expect(step3Btn).toBeEnabled({ timeout: 30_000 });
      await step3Btn.click();

      await expect(
        page.getByText("Your 3-card sequence — same branding, different messaging"),
      ).toBeVisible({ timeout: 30_000 });

      await expect(page.getByRole("img", { name: "Postcard preview" })).toBeVisible({
        timeout: 60_000,
      });

      await page.getByRole("button", { name: /Generate Proof/i }).click();

      // Wait for all 3 proof thumbnails to render.
      const proofImgs = page.locator('img[alt^="Proof for card"]');
      await expect(async () => {
        expect(await proofImgs.count()).toBeGreaterThanOrEqual(3);
      }).toPass({ timeout: 90_000, intervals: [500, 1000, 2000] });

      // Download PDF link should exist exactly once in the proof panel.
      const downloadLink = page.getByRole("link", { name: "Download PDF" });
      await expect(downloadLink).toBeVisible();
      await expect(downloadLink).toHaveCount(1);

      const href = await downloadLink.getAttribute("href");
      expect(href, "Download PDF href should point at a signed render-job URL").toMatch(
        DOWNLOAD_URL_RE,
      );

      // "Print-ready proof (N card/s)" label should render with 3.
      await expect(page.getByText(/Print-ready proof \(3 cards\)/)).toBeVisible();
    },
  );
});
