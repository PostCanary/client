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
    const step3Btn = page.getByRole("button", { name: /(?:3\s+)?Your Postcard/ });
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
        const arrayBuffer = await response.arrayBuffer();
        const digest = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hash = Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        return `size:${arrayBuffer.byteLength} sha256:${hash}`;
      });
    }

    const draftId = page.url().match(DRAFT_URL_RE)![1];
    const beforeSignature = await grabImgSrcSignature();

    // Trigger the edit. Mark the boundary so we can filter preview responses
    // that came AFTER the edit.
    editCommitted = true;
    await page.getByRole("button", { name: "✏️ Edit Headline" }).click();
    // S72 line-level editing: the headline editor is now five per-line
    // inputs; the first accent line drives this test.
    const headlineInput = page.getByTestId("headline-line-red1");
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

    await expect
      .poll(() => grabImgSrcSignature(), {
        timeout: 60_000,
        message: "expected the on-screen preview image bytes to change after headline edit",
      })
      .not.toBe(beforeSignature);

    // Stronger assertion: the on-screen <img src> bytes MUST match what
    // the preview-card endpoint serves when asked fresh. If they differ,
    // the composable is sitting on a stale blob (the Session 57 bug
    // class — save/fetch race leaving previewUrl pointing at a pre-save
    // render).
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
      .poll(() => grabImgSrcSignature(), {
        timeout: 60_000,
        message: "expected the on-screen preview to settle on the fresh server render",
      })
      .toBe(freshApiSignature);
    const imgSignature = await grabImgSrcSignature();

    await testInfo.attach("useCardPreview-console.log", {
      body: consoleMessages.join("\n"),
      contentType: "text/plain",
    });
    await testInfo.attach("signatures.txt", {
      body: `before=${beforeSignature}\nimg(after)=${imgSignature}\nfreshApi(after)=${freshApiSignature}`,
      contentType: "text/plain",
    });

    await page.screenshot({
      path: testInfo.outputPath("after-edit.png"),
      fullPage: true,
    });
  });
});
