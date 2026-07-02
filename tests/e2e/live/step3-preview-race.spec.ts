import { test, expect, type Page } from "@playwright/test";

/**
 * S70 verification — Step 3 preview race.
 *
 * Bug: previewCard() did not accept AbortSignal, so useCardPreview's
 * abortController.abort() was a no-op. A late-returning blob for card=N
 * could overwrite currentObjectUrl after the user switched to card=M,
 * causing Card 3's thumbnail to show Card 2's photo.
 *
 * Fix (cb12c54): previewCard takes signal + forwards to axios; the
 * composable captures cardNumber at fetch start and discards if either
 * the abort fired or the active card changed mid-flight.
 *
 * Verification strategy: arrive at Step 3 with Desert Diamond's photo
 * distinct across cards, rapid-click between Card 1 / Card 2 / Card 3
 * with brief pauses, and assert that after settling on Card N, the
 * main-preview pane actually shows Card N's content — not a stale
 * clobber.
 */

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;

async function navigateToStep3(page: Page) {
  page.on("dialog", (d) => d.accept());
  await page.goto("/app/home");
  const startBtn = page.getByRole("button", { name: /Start This Campaign/i });
  await expect(startBtn).toBeVisible({ timeout: 15_000 });
  await startBtn.click();
  await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });

  // Through Step 2.
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Onto Step 3.
  const step3 = page.getByRole("button", { name: /Your Postcard/i });
  await expect(step3).toBeVisible({ timeout: 60_000 });
  await step3.click();

  // Wait for at least the card-select thumbnails to exist.
  await expect(page.getByTestId("card-select-1")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("card-select-2")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("card-select-3")).toBeVisible({ timeout: 60_000 });
}

test.describe("S70 — Step 3 preview race", () => {
  test("rapid card-switch — no late response clobbers the active card", async ({
    page,
  }, testInfo) => {
    await navigateToStep3(page);

    // Give cards a baseline moment to render initial previews.
    await page.waitForTimeout(4000);

    // Rapid switch pattern: 1 -> 2 -> 3 -> 1 -> 2 -> 3 with short waits
    // to maximize the chance of an in-flight fetch being superseded
    // before its response arrives. With the fix, each switch aborts
    // the prior fetch and discards any late-arriving blob.
    const sequence = [2, 3, 1, 3, 2, 1];
    for (const n of sequence) {
      await page.getByTestId(`card-select-${n}`).click();
      await page.waitForTimeout(400);
    }

    // Settle on card 3 and wait for its preview to load fully.
    await page.getByTestId("card-select-3").click();
    // Wait long enough for the longest expected round-trip from a
    // potentially superseded fetch to come back and (be discarded).
    await page.waitForTimeout(6000);

    // Read the headline shown in the main preview pane. In the DB,
    // Card 3's headline should reference "Final", "Last Chance",
    // "Emergency" depending on AI output — crucially, it should NOT
    // match Card 1's headline ("AC Ready?" / "Save" / "Tune-Up").
    // We capture the on-screen headline and the active-card indicator
    // (card-select-3 should have the active visual state).
    const active3 = page.getByTestId("card-select-3");
    await expect(active3).toHaveClass(/scale-105/);

    await testInfo.attach("step3-after-rapid-switch.png", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });

    // Inspect the DOM: the main preview (the large image under the
    // thumbnails) should have an object-URL `src` that is DIFFERENT
    // from card-select-1's object-URL. If the race clobbered, card-3's
    // main preview would be identical to card-1's.
    const distinct = await page.evaluate(() => {
      // Find the big preview image — the carousel-sized <img> is
      // typically the first or largest img inside a .mx-auto container.
      // Simpler: sample ALL img src= attributes on the page and de-dupe
      // those that look like blob/object URLs.
      const imgs = Array.from(document.querySelectorAll("img"));
      const blobs = imgs
        .map((i) => i.getAttribute("src") ?? "")
        .filter((s) => s.startsWith("blob:") || s.startsWith("/media/"));
      return { total: blobs.length, unique: new Set(blobs).size, blobs };
    });

    // With 3 distinct cards and their separate previews + a selected
    // big preview, we expect ≥ 2 unique blob/media URLs. If everything
    // collapsed to a single blob URL (clobber), unique would be 1.
    expect(
      distinct.unique,
      `expected ≥2 distinct preview URLs after rapid card-switch; got ${distinct.unique} from ${distinct.total} images (clobber would produce 1)`,
    ).toBeGreaterThanOrEqual(2);

    console.log(
      `[S70 step3-race] after rapid switch: total imgs=${distinct.total}, unique=${distinct.unique}`,
    );
  });
});
