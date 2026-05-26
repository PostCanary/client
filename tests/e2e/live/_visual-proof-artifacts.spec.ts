import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { test, expect } from "@playwright/test";

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;
const OUT_DIR = "/private/tmp/postcanary-designer-visual-qa";

test.describe("visual proof artifacts", () => {
  test.skip(
    !process.env.E2E_CAPTURE_VISUAL_ARTIFACTS,
    "Set E2E_CAPTURE_VISUAL_ARTIFACTS=1 to save screenshots and proof PDFs.",
  );

  test("captures proof panel and generated PDFs for visual QA", async ({ page, request }) => {
    await mkdir(OUT_DIR, { recursive: true });
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
      page.getByText(/Your 3-card sequence.*same branding, different messaging/),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("img", { name: "Postcard preview" })).toBeVisible({
      timeout: 60_000,
    });

    await page.getByRole("button", { name: /Generate Proof/i }).click();
    await expect(page.locator('img[alt^="Proof for card"]').nth(2)).toBeVisible({
      timeout: 90_000,
    });
    await page.screenshot({
      path: path.join(OUT_DIR, "proof-panel.png"),
      fullPage: true,
    });

    const hrefs: string[] = [];
    for (const cardN of [1, 2, 3]) {
      const href = await page.getByTestId(`proof-pdf-link-${cardN}`).getAttribute("href");
      expect(href, `Card ${cardN} PDF href`).toBeTruthy();
      hrefs.push(href!);
      const response = await request.get(href!);
      expect(response.ok(), `Card ${cardN} PDF response`).toBe(true);
      await writeFile(path.join(OUT_DIR, `card-${cardN}.pdf`), await response.body());
    }

    await writeFile(path.join(OUT_DIR, "hrefs.json"), JSON.stringify(hrefs, null, 2));
  });
});
