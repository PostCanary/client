import { test, expect, type Page } from "@playwright/test";

/**
 * Offer edit regression guard.
 *
 * Headline, photo, review, and reset already have dedicated live guards. This
 * covers the remaining customer-facing text edit: changing offer copy must
 * persist, rerender the active preview, and feed the fresh server renderer.
 */

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;
const PREVIEW_CARD_RE = /\/api\/campaign-drafts\/([0-9a-f-]{36})\/preview-card\/(\d+)/;
const UNIQUE_OFFER = `E2E offer ${Date.now()}: $79 tune-up with priority booking`;

async function navigateToStep3(page: Page) {
  page.on("dialog", (dialog) => dialog.accept());
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
}

async function grabPreviewSignature(page: Page): Promise<string> {
  return await page.evaluate(async () => {
    const img = document.querySelector(
      'img[alt="Postcard preview"]',
    ) as HTMLImageElement | null;
    if (!img || !img.src) return "no-img";
    const response = await fetch(img.src);
    const arrayBuffer = await response.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `size:${arrayBuffer.byteLength} sha256:${hash}`;
  });
}

test.describe("offer edit — live stack", () => {
  test("editing offer updates the server-rendered preview without remount", async ({
    page,
  }, testInfo) => {
    const previewResponses: { cardN: number; status: number; afterEdit: boolean }[] = [];
    let editCommitted = false;
    page.on("response", (resp) => {
      const m = resp.url().match(PREVIEW_CARD_RE);
      if (!m) return;
      previewResponses.push({
        cardN: Number(m[2]),
        status: resp.status(),
        afterEdit: editCommitted,
      });
    });

    await navigateToStep3(page);
    await expect
      .poll(() => previewResponses.some((r) => r.cardN === 1 && r.status === 200), {
        timeout: 90_000,
      })
      .toBe(true);

    const beforeSignature = await grabPreviewSignature(page);
    const draftId = page.url().match(DRAFT_URL_RE)![1];

    editCommitted = true;
    await page.getByRole("button", { name: "🏷️ Edit Offer" }).click();
    const offerInput = page.locator('textarea[maxlength="200"]').first();
    await expect(offerInput).toBeVisible();
    await offerInput.fill(UNIQUE_OFFER);

    await expect
      .poll(
        () =>
          previewResponses.filter((r) => r.cardN === 1 && r.status === 200 && r.afterEdit)
            .length,
        { timeout: 45_000, message: "expected preview-card 200 after offer edit" },
      )
      .toBeGreaterThanOrEqual(1);
    await expect
      .poll(() => grabPreviewSignature(page), {
        timeout: 60_000,
        message: "expected the on-screen preview image bytes to change after offer edit",
      })
      .not.toBe(beforeSignature);

    const freshApiSignature = await page.evaluate(async (id) => {
      const csrfRes = await fetch("/auth/csrf-token", { credentials: "include" });
      const csrf = csrfRes.ok ? (await csrfRes.json()).csrf_token : "";
      const res = await fetch(`/api/campaign-drafts/${id}/preview-card/1`, {
        method: "POST",
        credentials: "include",
        headers: csrf ? { "X-CSRF-Token": csrf } : {},
      });
      if (!res.ok) return `status:${res.status}`;
      const arrayBuffer = await res.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return `size:${arrayBuffer.byteLength} sha256:${hash}`;
    }, draftId);
    await expect
      .poll(() => grabPreviewSignature(page), {
        timeout: 60_000,
        message: "expected the on-screen offer preview to settle on the fresh server render",
      })
      .toBe(freshApiSignature);
    const imgSignature = await grabPreviewSignature(page);

    await testInfo.attach("offer-signatures.txt", {
      body: `before=${beforeSignature}\nimg(after)=${imgSignature}\nfreshApi(after)=${freshApiSignature}`,
      contentType: "text/plain",
    });

    await page.screenshot({
      path: testInfo.outputPath("after-offer-edit.png"),
      fullPage: true,
    });
  });
});
