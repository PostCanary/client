import { test, expect, type Page } from "@playwright/test";

/**
 * Change Photo + Change Review picker regression tests.
 *
 * Verifies each picker:
 *   1. Renders options from brand_kit.photos / brand_kit.reviews.
 *   2. Clicking a non-active option changes the server-rendered preview
 *      (detected via <img src> bytes != pre-click capture).
 *
 * Relies on the same 500ms save-debounce fix as headline-edit.spec.ts —
 * without it the preview fetches stale DB content after the override.
 */

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;
const PREVIEW_CARD_RE = /\/api\/campaign-drafts\/([0-9a-f-]{36})\/preview-card\/(\d+)/;

async function navigateToStep3(page: Page) {
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/app/send");
  await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });

  await page
    .getByRole("button", { name: /Recommended\s+Neighbor Marketing/i })
    .click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const step3 = page.getByRole("button", { name: /3\s+Your Postcard/ });
  await expect(step3).toBeEnabled({ timeout: 30_000 });
  await step3.click();

  await expect(
    page.getByText("Your 3-card sequence — same branding, different messaging"),
  ).toBeVisible({ timeout: 30_000 });
}

async function waitForInitialPreview(page: Page, previewResponses: { cardN: number; status: number }[]) {
  await expect
    .poll(() => previewResponses.some((r) => r.cardN === 1 && r.status === 200), {
      timeout: 90_000,
    })
    .toBe(true);
}

async function grabImgSrcSignature(page: Page): Promise<string> {
  return await page.evaluate(async () => {
    const img = document.querySelector(
      'img[alt="Postcard preview"]',
    ) as HTMLImageElement | null;
    if (!img || !img.src) return "no-img";
    const response = await fetch(img.src);
    const buf = new Uint8Array(await response.arrayBuffer());
    const head = Array.from(buf.slice(0, 64))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `size:${buf.byteLength} head:${head}`;
  });
}

function attachPreviewListener(page: Page) {
  const previewResponses: { cardN: number; status: number; afterAction: boolean }[] = [];
  let afterAction = false;
  page.on("response", (resp) => {
    const m = resp.url().match(PREVIEW_CARD_RE);
    if (!m) return;
    previewResponses.push({
      cardN: Number(m[2]),
      status: resp.status(),
      afterAction,
    });
  });
  return {
    previewResponses,
    markActionBoundary: () => {
      afterAction = true;
    },
  };
}

test.describe("pickers — live stack", () => {
  test("Change Photo picker swaps the server-rendered preview", async ({
    page,
  }, testInfo) => {
    const { previewResponses, markActionBoundary } = attachPreviewListener(page);
    await navigateToStep3(page);
    await waitForInitialPreview(page, previewResponses);
    const beforeSig = await grabImgSrcSignature(page);

    await page.getByTestId("edit-photo-toggle").click();

    const options = page.locator('[data-testid^="photo-option-"]');
    const count = await options.count();
    test.skip(count < 2, "brand kit has fewer than 2 photo options — picker swap cannot be proved");

    // Find an option NOT currently selected (border-[#47bfa9] marks active).
    let targetIndex = -1;
    for (let i = 0; i < count; i++) {
      const cls = (await options.nth(i).getAttribute("class")) ?? "";
      if (!cls.includes("border-[#47bfa9]")) {
        targetIndex = i;
        break;
      }
    }
    expect(targetIndex, "expected at least one non-active photo option").toBeGreaterThanOrEqual(0);

    markActionBoundary();
    await options.nth(targetIndex).click();

    await expect
      .poll(
        () =>
          previewResponses.filter(
            (r) => r.cardN === 1 && r.status === 200 && r.afterAction,
          ).length,
        { timeout: 45_000, message: "expected preview-card 200 after photo swap" },
      )
      .toBeGreaterThanOrEqual(1);
    await page.waitForTimeout(2000);

    const afterSig = await grabImgSrcSignature(page);
    await testInfo.attach("photo-signatures.txt", {
      body: `before=${beforeSig}\nafter=${afterSig}`,
      contentType: "text/plain",
    });

    expect(
      afterSig,
      `photo swap should change the preview bytes. before=${beforeSig} after=${afterSig}`,
    ).not.toBe(beforeSig);

    await page.screenshot({
      path: testInfo.outputPath("after-photo-swap.png"),
      fullPage: true,
    });
  });

  test("Change Review picker swaps the server-rendered preview", async ({
    page,
  }, testInfo) => {
    const { previewResponses, markActionBoundary } = attachPreviewListener(page);
    await navigateToStep3(page);
    await waitForInitialPreview(page, previewResponses);
    const beforeSig = await grabImgSrcSignature(page);

    await page.getByTestId("edit-review-toggle").click();

    const options = page.locator('[data-testid^="review-option-"]');
    const count = await options.count();
    test.skip(count < 2, "brand kit has fewer than 2 reviews — picker swap cannot be proved");

    let targetIndex = -1;
    for (let i = 0; i < count; i++) {
      const cls = (await options.nth(i).getAttribute("class")) ?? "";
      if (!cls.includes("border-[#47bfa9]")) {
        targetIndex = i;
        break;
      }
    }
    expect(targetIndex, "expected at least one non-active review option").toBeGreaterThanOrEqual(0);

    markActionBoundary();
    await options.nth(targetIndex).click();

    await expect
      .poll(
        () =>
          previewResponses.filter(
            (r) => r.cardN === 1 && r.status === 200 && r.afterAction,
          ).length,
        { timeout: 45_000, message: "expected preview-card 200 after review swap" },
      )
      .toBeGreaterThanOrEqual(1);
    await page.waitForTimeout(2000);

    const afterSig = await grabImgSrcSignature(page);
    await testInfo.attach("review-signatures.txt", {
      body: `before=${beforeSig}\nafter=${afterSig}`,
      contentType: "text/plain",
    });

    expect(
      afterSig,
      `review swap should change the preview bytes. before=${beforeSig} after=${afterSig}`,
    ).not.toBe(beforeSig);

    await page.screenshot({
      path: testInfo.outputPath("after-review-swap.png"),
      fullPage: true,
    });
  });
});
