import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Regression guard for the Download PDF link in Step 3's proof panel.
 *
 * Verifies both the legacy first-card Download PDF link and the per-card PDF
 * links that QA needs for visual inspection of Card 1/2/3 artwork.
 */

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;
const DOWNLOAD_URL_RE = /\/api\/render-jobs\/[0-9a-f-]{36}\/cards\/\d+\?sig=[a-f0-9]+&exp=\d+/;

async function expectPdfResponse(
  request: APIRequestContext,
  href: string | null,
  label: string,
) {
  expect(href, `${label} href should exist`).toBeTruthy();
  const response = await request.get(href!);
  expect(response.ok(), `${label} PDF should return 2xx`).toBe(true);
  expect(
    response.headers()["content-type"] ?? "",
    `${label} PDF should have an application/pdf content-type`,
  ).toContain("application/pdf");

  const body = await response.body();
  expect(body.byteLength, `${label} PDF should not be a tiny placeholder`).toBeGreaterThan(1_000);
  expect(
    body.subarray(0, 5).toString("utf8"),
    `${label} PDF should start with the PDF magic bytes`,
  ).toBe("%PDF-");
}

test.describe("download pdf link — live stack", () => {
  test(
    "after Generate Proof, Download PDF link is present with signed render-job URL",
    async ({ page, request }) => {
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

      // Legacy first-card shortcut remains for existing users.
      const downloadLink = page.getByRole("link", { name: "Download PDF" });
      await expect(downloadLink).toBeVisible();
      await expect(downloadLink).toHaveCount(1);

      const href = await downloadLink.getAttribute("href");
      expect(href, "Download PDF href should point at a signed render-job URL").toMatch(
        DOWNLOAD_URL_RE,
      );
      await expectPdfResponse(request, href, "legacy first-card");

      for (const cardN of [1, 2, 3]) {
        const cardLink = page.getByTestId(`proof-pdf-link-${cardN}`);
        await expect(cardLink).toBeVisible();
        await expect(
          cardLink,
          `Card ${cardN} PDF link should point at its signed render-job URL`,
        ).toHaveAttribute("href", DOWNLOAD_URL_RE);
        await expectPdfResponse(request, await cardLink.getAttribute("href"), `card ${cardN}`);
      }

      // "Print-ready proof (N card/s)" label should render with 3.
      await expect(page.getByText(/Print-ready proof \(3 cards\)/)).toBeVisible();
    },
  );
});
