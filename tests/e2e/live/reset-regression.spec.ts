import { test, expect, type Page } from "@playwright/test";

/**
 * Reset to Original regression — Codex S57 HIGH 2.
 *
 * Before the fix, originalCards was captured via shallow spread `{ ...c }`,
 * so nested `resolvedContent` / `overrides` / `backContent` shared refs with
 * the live cards. A photo swap via updatePhoto mutated those shared refs,
 * poisoning originalCards — and "Reset to Original" failed to restore the
 * pre-mutation state (the preview still rendered the swapped photo).
 *
 * Fix: structuredClone at capture (onMounted L114 + watch L205) AND at
 * reset (L182). This spec proves the round-trip:
 *   baseline → swap photo → bytes differ → reset → bytes equal baseline.
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
  const previewResponses: { cardN: number; status: number; phase: string }[] = [];
  let phase = "baseline";
  page.on("response", (resp) => {
    const m = resp.url().match(PREVIEW_CARD_RE);
    if (!m) return;
    previewResponses.push({
      cardN: Number(m[2]),
      status: resp.status(),
      phase,
    });
  });
  return {
    previewResponses,
    setPhase: (p: string) => {
      phase = p;
    },
  };
}

async function waitForPreviewInPhase(
  previewResponses: { cardN: number; status: number; phase: string }[],
  phase: string,
  message: string,
) {
  await expect
    .poll(
      () =>
        previewResponses.filter(
          (r) => r.cardN === 1 && r.status === 200 && r.phase === phase,
        ).length,
      { timeout: 45_000, message },
    )
    .toBeGreaterThanOrEqual(1);
}

test.describe("reset regression — live stack", () => {
  test("Reset to Original restores the original preview after a photo swap", async ({
    page,
  }, testInfo) => {
    const { previewResponses, setPhase } = attachPreviewListener(page);
    await navigateToStep3(page);

    await waitForPreviewInPhase(previewResponses, "baseline", "expected baseline preview-card 200");
    await page.waitForTimeout(1500);
    const baselineSig = await grabImgSrcSignature(page);

    // --- Swap photo ---
    await page.getByTestId("edit-photo-toggle").click();

    const options = page.locator('[data-testid^="photo-option-"]');
    const count = await options.count();
    test.skip(count < 2, "brand kit has fewer than 2 photo options — cannot prove round-trip");

    let targetIndex = -1;
    for (let i = 0; i < count; i++) {
      const active = await options.nth(i).getAttribute("data-active");
      if (active === "false") {
        targetIndex = i;
        break;
      }
    }
    expect(targetIndex, "expected at least one non-active photo option").toBeGreaterThanOrEqual(0);

    setPhase("swapped");
    await options.nth(targetIndex).click();
    await waitForPreviewInPhase(previewResponses, "swapped", "expected preview-card 200 after photo swap");
    await page.waitForTimeout(2000);
    const swappedSig = await grabImgSrcSignature(page);

    expect(
      swappedSig,
      `photo swap should change preview bytes. baseline=${baselineSig} swapped=${swappedSig}`,
    ).not.toBe(baselineSig);

    // --- Reset ---
    setPhase("reset");
    await page.getByTestId("reset-to-original").click();
    await waitForPreviewInPhase(previewResponses, "reset", "expected preview-card 200 after reset");
    await page.waitForTimeout(2000);
    const resetSig = await grabImgSrcSignature(page);

    await testInfo.attach("reset-signatures.txt", {
      body: `baseline=${baselineSig}\nswapped=${swappedSig}\nreset=${resetSig}`,
      contentType: "text/plain",
    });

    // With the shallow-clone bug, resetSig === swappedSig (originalCards was poisoned).
    // With the fix, resetSig === baselineSig (deep clone preserved original state).
    expect(
      resetSig,
      `Reset to Original should restore baseline bytes. baseline=${baselineSig} reset=${resetSig}`,
    ).toBe(baselineSig);

    await page.screenshot({
      path: testInfo.outputPath("after-reset.png"),
      fullPage: true,
    });
  });
});
