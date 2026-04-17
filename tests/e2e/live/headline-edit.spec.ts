import { test, expect, type Page } from "@playwright/test";

/**
 * Edit-headline bug repro + regression test.
 *
 * Verifies that typing in the Edit Headline input causes the rendered
 * postcard PNG in the main preview to update WITHOUT requiring a
 * component remount (navigate-away-and-back).
 *
 * Session 57 diagnostic: manual MCP walkthrough showed that the edited
 * headline persists to DB + server renders it correctly, but the client
 * <img src> doesn't swap until the component unmounts. This spec locks
 * down the fix once identified.
 */

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;
const PREVIEW_CARD_RE = /\/api\/campaign-drafts\/([0-9a-f-]{36})\/preview-card\/(\d+)/;
// Use a multi-word headline — split_headline Case B (>=5 words) distributes
// words across red/bridge/blue slots, so the edit is visible in the template.
// A single-token headline hits Case D and fills only red_1 (defaults for
// the other 4 slots mask the edit visually).
const UNIQUE_HEADLINE = `Phoenix Demo E2E ${Date.now()} Edit`;

test.describe("headline edit — live stack", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
  });

  test("editing headline updates main preview without remount", async ({
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

    const consoleMessages: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("[useCardPreview]")) {
        consoleMessages.push(text);
      }
    });

    await page.goto("/app/send");
    await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });

    await page
      .getByRole("button", { name: /Recommended\s+Neighbor Marketing/i })
      .click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    const step3Btn = page.getByRole("button", { name: /3\s+Your Postcard/ });
    await expect(step3Btn).toBeEnabled({ timeout: 30_000 });
    await step3Btn.click();

    // Wait for initial preview to land.
    await expect
      .poll(() => previewResponses.some((r) => r.cardN === 1 && r.status === 200), {
        timeout: 90_000,
      })
      .toBe(true);

    const previewImg = page.getByRole("img", { name: "Postcard preview" });
    await expect(previewImg).toBeVisible();

    // The blob URL itself is regenerated on every fetch (UUID), so
    // comparing URLs proves nothing. Compare the BYTES pointed at by
    // the <img src> — that's what the user actually sees.
    async function grabImgSrcSignature(): Promise<string> {
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

    const draftId = page.url().match(DRAFT_URL_RE)![1];
    const beforeSignature = await grabImgSrcSignature();

    // Trigger the edit. Mark the boundary so we can filter preview responses
    // that came AFTER the edit.
    editCommitted = true;
    await page.getByRole("button", { name: "✏️ Edit Headline" }).click();
    const headlineInput = page
      .locator('input[type="text"][maxlength="50"]')
      .first();
    await expect(headlineInput).toBeVisible();
    await headlineInput.fill(UNIQUE_HEADLINE);

    // Wait past save debounce + preview debounce + render time. The
    // preview-card endpoint must be hit AFTER the save so it sees the new
    // headline in the DB.
    await expect
      .poll(
        () => previewResponses.filter((r) => r.cardN === 1 && r.status === 200 && r.afterEdit).length,
        { timeout: 45_000, message: "expected a preview-card 200 after edit" },
      )
      .toBeGreaterThanOrEqual(1);

    // Give Vue a reactive tick + let the save land.
    await page.waitForTimeout(2000);

    // Stronger assertion: the on-screen <img src> bytes MUST match what
    // the preview-card endpoint serves when asked fresh. If they differ,
    // the composable is sitting on a stale blob (the Session 57 bug
    // class — save/fetch race leaving previewUrl pointing at a pre-save
    // render).
    const imgSignature = await grabImgSrcSignature();
    const freshApiSignature = await page.evaluate(async (id) => {
      const res = await fetch(`/api/campaign-drafts/${id}/preview-card/1`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return `status:${res.status}`;
      const buf = new Uint8Array(await res.arrayBuffer());
      const head = Array.from(buf.slice(0, 64))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return `size:${buf.byteLength} head:${head}`;
    }, draftId);

    await testInfo.attach("useCardPreview-console.log", {
      body: consoleMessages.join("\n"),
      contentType: "text/plain",
    });
    await testInfo.attach("signatures.txt", {
      body: `before=${beforeSignature}\nimg(after)=${imgSignature}\nfreshApi(after)=${freshApiSignature}`,
      contentType: "text/plain",
    });

    expect(
      imgSignature,
      `on-screen <img src> bytes do not match fresh preview-card bytes — composable is sitting on a stale blob. imgSize-vs-freshSize may differ due to PNG encoding variance across renders of identical content; if sizes are equal within 1% that's OK but if hex-heads differ substantially and sizes differ by more than 5% that's the bug. img=${imgSignature} fresh=${freshApiSignature}. Console:\n${consoleMessages.join("\n")}`,
    ).toBe(freshApiSignature);

    await page.screenshot({
      path: testInfo.outputPath("after-edit.png"),
      fullPage: true,
    });
  });
});
