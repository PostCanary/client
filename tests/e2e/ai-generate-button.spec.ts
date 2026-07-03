// S90 "Generate with AI" button (StepDesign toolbar): composes the S89
// scrape/regen primitives (see AI-SCRAPE-TRIGGERS-SPEC-2026-07-02.md and
// ai-scrape-triggers.spec.ts) behind one click. Drives the
// /dev/step-design-fold harness — same pattern as Part B of
// ai-scrape-triggers.spec.ts — since it mounts StepDesign directly without
// needing to complete Steps 1-2 of the wizard. The harness seeds a
// settled, real-scan brand kit locally (see StepDesignFold.vue) — that
// local state, not mockApi's state.brandKit, is what the button reads on
// mount, since the harness never calls brandKitStore.fetch().
import { expect, test } from "@playwright/test";
import { createMockAppState, installMockApi } from "./support/mockApi";

test.describe("Generate with AI button", () => {
  test("click with a saved website and a completed real scan fires a generate request directly, no rescan", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);

    await page.goto("/dev/step-design-fold");

    const button = page.getByTestId("ai-generate-btn");
    await expect(button).toBeVisible();
    await expect(button).toHaveText("✨ Generate with AI");

    const generateRequest = page.waitForRequest(
      (req) =>
        req.url().includes("/api/brand-kit/generate") && req.method() === "POST",
    );
    await button.click();
    await generateRequest;

    // A real scan already happened (extractionSources present in the
    // harness-seeded kit) — no rescan, straight to generation.
    expect(state.requestLog.scrapeRequests).toHaveLength(0);
  });

  test("click with no website opens a modal; submitting saves the URL then scans", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);

    await page.goto("/dev/step-design-fold");

    // Clear the website via the existing Business Info flow first (the
    // harness's initial local kit always has one) so the button's
    // no-website branch is reachable.
    await page.getByTestId("toolbar-business").click();
    await page.getByTestId("biz-website-input").fill("");
    await page.getByTestId("biz-save").click();
    await expect(page.getByTestId("biz-rescan-website")).toBeDisabled();

    await page.getByTestId("ai-generate-btn").click();

    const modal = page.getByTestId("ai-generate-website-modal");
    await expect(modal).toBeVisible();

    const updateRequest = page.waitForRequest(
      (req) => req.url().includes("/api/brand-kit") && req.method() === "PUT",
    );
    await page
      .getByTestId("ai-generate-website-input")
      .fill("newbiz.example");
    await page.getByTestId("ai-generate-website-submit").click();
    await updateRequest;

    await expect
      .poll(() => state.requestLog.scrapeRequests.length)
      .toBe(1);
    expect(state.requestLog.scrapeRequests[0]?.website_url).toBe(
      "newbiz.example",
    );
    await expect(modal).toBeHidden();
  });

  test("is hidden entirely when the org lacks postcards access", async ({
    page,
  }) => {
    const state = createMockAppState();
    (state.authMe as Record<string, unknown>).features = [];
    await installMockApi(page, state);

    await page.goto("/dev/step-design-fold");

    await expect(page.getByTestId("ai-generate-btn")).toHaveCount(0);
  });
});
