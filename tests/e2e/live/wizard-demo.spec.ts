import { test, expect, type Page } from "@playwright/test";

/**
 * Demo-protection spec: the 3-card wizard flow still renders real postcards.
 *
 * Runs against the LIVE dev stack (nginx :8080 → Flask api-dev → render-worker).
 * Replaces the manual Session 56 MCP walkthrough that verified the Session 55
 * photo pipeline persistence fix + client-side printReady filter.
 *
 * Protects against regressions in:
 *   - Auth + cookie flow
 *   - /app/send draft auto-creation
 *   - Step 1 → Step 3 navigation
 *   - Real preview-card pipeline (POST /api/campaign-drafts/{id}/preview-card/{n})
 *   - Real photo rendering (brand kit photos → WeasyPrint PDF → pdf2image PNG)
 *   - Client-side printReady filter preventing low-quality photo selection
 *   - render-worker X-Render-Warnings signal (e.g., PHOTO_UNREACHABLE fallback)
 */

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;
const PREVIEW_CARD_RE = /\/api\/campaign-drafts\/([0-9a-f-]{36})\/preview-card\/(\d+)/;
// X-Render-Warnings values that MUST fail the demo protection check. A cut-off
// or unreachable-photo warning means the user-visible postcard degraded.
const BLOCKING_WARNINGS = ["CONTENT_CUTOFF", "PHOTO_UNREACHABLE", "LOGO_UNREACHABLE"];

test.describe("wizard demo flow — live stack", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
  });

  test(
    "Step 3 renders real postcard previews for all 3 cards via preview-card endpoint",
    async ({ page }, testInfo) => {
      const previewResponses: {
        draftId: string;
        cardN: number;
        status: number;
        warnings: string;
      }[] = [];
      page.on("response", async (resp) => {
        const m = resp.url().match(PREVIEW_CARD_RE);
        if (!m) return;
        previewResponses.push({
          draftId: m[1],
          cardN: Number(m[2]),
          status: resp.status(),
          warnings: resp.headers()["x-render-warnings"] ?? "",
        });
      });

      await page.goto("/app/send");
      await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });
      const draftId = page.url().match(DRAFT_URL_RE)![1];

      await page
        .getByRole("button", { name: /Recommended\s+Neighbor Marketing/i })
        .click();
      await page.getByRole("button", { name: "Next", exact: true }).click();

      const step3Btn = page.getByRole("button", { name: /3\s+Your Postcard/ });
      await expect(step3Btn, "Step 3 tab should become enabled after Step 1 Next").toBeEnabled({
        timeout: 30_000,
      });
      await step3Btn.click();

      await expect(
        page.getByText("Your 3-card sequence — same branding, different messaging"),
      ).toBeVisible({ timeout: 30_000 });

      // Anthropic generation can take 20-30s per card and the client debounces
      // save-race 400s for up to ~20s before retrying. Give each card 120s.
      // S61 Bug #5 fix: PostcardPreview now accepts `disable-flip` which
      // SequenceView passes for thumbnails. The outer <button> no longer
      // nests a flip <button>, so normal Playwright click() works.
      for (const cardN of [1, 2, 3]) {
        await page.getByTestId(`card-select-${cardN}`).click();
        await expect
          .poll(
            () =>
              previewResponses.some(
                (r) => r.draftId === draftId && r.cardN === cardN && r.status === 200,
              ),
            {
              timeout: 120_000,
              message: `preview-card ${cardN} for draft ${draftId} should return 200`,
            },
          )
          .toBe(true);
      }

      const problems = previewResponses
        .filter((r) => r.draftId === draftId && r.status === 200 && r.warnings)
        .flatMap((r) =>
          r.warnings
            .split(",")
            .map((w) => w.trim())
            .filter((w) => BLOCKING_WARNINGS.some((b) => w.startsWith(b)))
            .map((w) => `card ${r.cardN}: ${w}`),
        );
      expect(
        problems,
        `blocking X-Render-Warnings for draft ${draftId}: ${problems.join("; ")}`,
      ).toEqual([]);

      const previewImg = page.getByRole("img", { name: "Postcard preview" });
      await expect(previewImg).toBeVisible();
      const src = await previewImg.getAttribute("src");
      expect(src, "preview img src should be a blob or data URL").toMatch(
        /^(blob:|data:|http)/,
      );

      await expect(page.getByText("Card 1: The Offer")).toBeVisible();
      await expect(page.getByText("Card 2: Social Proof")).toBeVisible();
      await expect(page.getByText("Card 3: Last Chance")).toBeVisible();

      await page.screenshot({
        path: testInfo.outputPath("step3-card1-preview.png"),
        fullPage: true,
      });
    },
  );
});
