import { test, expect, type Page } from "@playwright/test";

/**
 * Session 61 Bug #1+#2 regression — EditPanel buffers must clear on Reset.
 *
 * Before S61: EditPanel.vue watched only props.card.cardNumber. Reset to
 * Original replaced resolvedContent without bumping cardNumber, so the
 * editableHeadline/editableOffer refs stayed populated with the user's
 * stale typed text. Symptoms:
 *   (1) preview PNG reset correctly but Edit Headline input still showed
 *       the pre-Reset text
 *   (2) typing one character after Reset replayed the stale buffer
 *       through applyHeadline/applyOffer, re-corrupting the card
 *
 * Fix: expanded watch key to [cardNumber, resolvedContent.headline,
 * resolvedContent.offerText]. When Reset mutates resolvedContent, the
 * watch fires and re-syncs the refs.
 *
 * This test proves:
 *   A. After typing QA chars and clicking Reset, the Edit Headline input
 *      value returns to the original headline text (not the typed text).
 *   B. Typing one additional character after Reset results in the preview
 *      matching original+1 char, NOT a replay of the pre-Reset buffer.
 *
 * Symptom (A) is the visible-to-operator part; (B) is the silent-corruption
 * part.
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

async function waitForFirstPreview(page: Page, previewResponses: { cardN: number; status: number }[]) {
  await expect
    .poll(() => previewResponses.some((r) => r.cardN === 1 && r.status === 200), {
      timeout: 90_000,
      message: "initial preview-card 1 should return 200",
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
    const head = Array.from(buf.slice(0, 32))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `size:${buf.byteLength} head:${head}`;
  });
}

test.describe("reset regression — editor buffers", () => {
  test("Reset to Original clears Edit Headline input AND a subsequent keystroke does not replay stale buffer", async ({
    page,
  }, testInfo) => {
    const previewResponses: { cardN: number; status: number }[] = [];
    page.on("response", (resp) => {
      const m = resp.url().match(PREVIEW_CARD_RE);
      if (m) previewResponses.push({ cardN: Number(m[2]), status: resp.status() });
    });

    await navigateToStep3(page);
    await waitForFirstPreview(page, previewResponses);

    // Open Edit Headline and capture the baseline (original) value.
    await page.getByRole("button", { name: /Edit Headline/i }).click();
    const input = page.locator(
      'input[type="text"][maxlength="50"]',
    );
    await expect(input).toBeVisible();
    const originalHeadline = (await input.inputValue()).trim();
    expect(
      originalHeadline.length,
      "original headline should be non-empty to drive the test",
    ).toBeGreaterThan(0);

    const baselineSig = await grabImgSrcSignature(page);

    // Type QA chars. Debounced preview fetch at ~1.5s + server render may
    // take up to ~20s before retry. We only need the ref to hold the stale
    // text for the Reset step; don't wait for the intermediate render.
    const QA_STRING = "QATESTHEADLINE1234";
    await input.fill(QA_STRING);
    await expect(input, "typed text should appear in the input").toHaveValue(QA_STRING);

    // Click Reset to Original.
    await page.getByTestId("reset-to-original").click();

    // ASSERTION A: the input value should return to the original headline.
    // Without the S61 watch expansion, this value remains QATESTHEADLINE1234
    // because the watch never fires.
    await expect(
      input,
      "Reset to Original must clear Edit Headline input buffer — S61 Bug #1",
    ).toHaveValue(originalHeadline, { timeout: 10_000 });

    // Wait for preview to return to baseline bytes. We don't assert exact
    // byte match (mem 478 — post-logo non-determinism is known) but we do
    // expect the bytes to stabilize and we want one post-reset 200 response.
    const preResetCount = previewResponses.filter(
      (r) => r.cardN === 1 && r.status === 200,
    ).length;
    await expect
      .poll(
        () =>
          previewResponses.filter((r) => r.cardN === 1 && r.status === 200)
            .length > preResetCount,
        { timeout: 45_000, message: "expected at least one post-reset preview-card 200" },
      )
      .toBe(true);
    await page.waitForTimeout(2000);
    const afterResetSig = await grabImgSrcSignature(page);

    // ASSERTION B: type one additional character after Reset. The buffer
    // should now be original+'Z', not QATESTHEADLINE1234+'Z'. The preview
    // bytes should reflect only the single-char change, not the replay.
    // We prove this by asserting the post-type value of the input is
    // exactly original+'Z'.
    await input.focus();
    await input.press("End");
    await input.type("Z");
    const expectedAfterType = `${originalHeadline}Z`;
    await expect(
      input,
      "Typing after Reset must build on original headline, not replay stale buffer — S61 Bug #2",
    ).toHaveValue(expectedAfterType, { timeout: 5_000 });

    // Wait for another preview cycle and capture the signature — serves as
    // evidence attached to the test run even if we don't assert byte values.
    const preTypeCount = previewResponses.filter(
      (r) => r.cardN === 1 && r.status === 200,
    ).length;
    await expect
      .poll(
        () =>
          previewResponses.filter((r) => r.cardN === 1 && r.status === 200)
            .length > preTypeCount,
        { timeout: 45_000, message: "expected preview-card 200 after single-char type" },
      )
      .toBe(true);
    await page.waitForTimeout(2000);
    const afterTypeSig = await grabImgSrcSignature(page);

    await testInfo.attach("signatures.txt", {
      body: `original-headline=${originalHeadline}\nbaseline=${baselineSig}\nafter-reset=${afterResetSig}\nafter-single-type=${afterTypeSig}\nexpected-input=${expectedAfterType}`,
      contentType: "text/plain",
    });
  });
});
