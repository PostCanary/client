import { test, expect, type Page } from "@playwright/test";

/**
 * Session 61 Bug #5 regression — card-select thumbnail must not flip.
 *
 * Before S61: SequenceView wrapped <PostcardPreview> in outer <button>.
 * PostcardPreview had (a) wrapper <div @click="flip"> and (b) inner
 * <button @click.stop="flip">. Nested <button> HTML is invalid and the
 * wrapper flip-click competed with the parent button's select-click.
 * Normal Playwright click() routed unpredictably — wizard-demo.spec.ts
 * had to use .evaluate(el => el.click()) to bypass the broken path.
 *
 * Fix: PostcardPreview gained `disableFlip` prop. When true:
 *   - wrapper div's @click is no-op
 *   - inner Flip button is not rendered
 * SequenceView passes :disable-flip="true" for thumbnails.
 *
 * This test proves: normal .click() on card-select-N makes that card
 * active AND does NOT flip any thumbnail to the back. No "Show front"
 * state should appear after click.
 */

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;

async function navigateToStep3(page: Page) {
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/app/send");
  await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });

  await page
    .getByRole("button", { name: /Recommended\s+Neighbor Marketing/i })
    .click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const step3 = page.getByRole("button", { name: /(?:3\s+)?Your Postcard/ });
  await expect(step3).toBeEnabled({ timeout: 30_000 });
  await step3.click();

  await expect(
    page.getByText("Your 3-card sequence — same branding, different messaging"),
  ).toBeVisible({ timeout: 30_000 });
}

test.describe("card select — no flip hijack", () => {
  test("normal click selects the card without flipping any thumbnail", async ({
    page,
  }) => {
    await navigateToStep3(page);

    // Wait for carousel buttons to render for all 3 cards.
    for (const cardN of [1, 2, 3]) {
      await expect(page.getByTestId(`card-select-${cardN}`)).toBeVisible({
        timeout: 90_000,
      });
    }

    // Before any click, no thumbnail should be showing the back. Assert by
    // checking that the "Show front" label (rendered only on flipped state)
    // is not visible anywhere in the carousel.
    await expect(
      page.getByRole("button", { name: "Show front" }),
      "no thumbnail should start in flipped state",
    ).toHaveCount(0);

    // Normal Playwright click — no .evaluate() workaround. This is the whole
    // point of the Bug #5 fix.
    await page.getByTestId("card-select-2").click();

    // Card 2 should become active. Active card has scale-105 + border-[#47bfa9].
    // Easiest assertion: the card-select-2 button should have the scale-105
    // class (from SequenceView.vue :class).
    await expect(
      page.getByTestId("card-select-2"),
      "card 2 should be the active card after click",
    ).toHaveClass(/scale-105/);

    // After click, NO thumbnail should have flipped — no "Show front" button
    // should have appeared anywhere in the carousel.
    await expect(
      page.getByRole("button", { name: "Show front" }),
      "click on thumbnail must not flip it — thumbnail flip is disabled via disable-flip prop",
    ).toHaveCount(0);
  });
});
