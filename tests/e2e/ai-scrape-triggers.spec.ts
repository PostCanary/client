// AI-scrape-triggers spec (2026-07-02): S89 fixes for the invisible/
// mistimed website scrape (see AI-SCRAPE-TRIGGERS-SPEC-2026-07-02.md).
//
// Part A drives the real wizard entry (SendWizard → WizardShell) to prove
// Fix B/D wiring: the backfill scrape fires as soon as the wizard mounts
// (not just when Step 3 happens to render), and the progress strip
// reflects it. StepGoal.vue auto-selects "Neighbor Marketing" for an
// untouched draft on its own mount, so no click is needed to trigger
// generateCardsForDraft's scrape-wait ordering.
//
// Part B drives the /dev/step-design-fold harness (same pattern as
// photo-adjust-on-canvas.spec.ts) to reach EditPanel's Business Info panel
// directly, proving Fix A: URL-change-triggers-rescan and the explicit
// Rescan control, without needing to complete Steps 1-2 of the wizard.
//
// Fix C (silent auto-refresh toast / edited-design banner) is covered by
// src/composables/useScrapeRegenWatcher.spec.ts's unit tests instead of
// here — driving it through a live Steps 1→2→3 wizard traversal (map
// drawing, targeting, etc.) for e2e coverage would be disproportionately
// expensive for the incremental confidence it buys over the unit suite.
import { expect, test } from "@playwright/test";
import { createMockAppState, installMockApi } from "./support/mockApi";

test.describe("AI scrape triggers — wizard entry (Fix B/D)", () => {
  test("a pending brand kit is scraped as soon as the wizard mounts, and the progress strip reflects it", async ({
    page,
  }) => {
    const state = createMockAppState();
    state.brandKit.scrape_status = "pending";
    state.scrapePollsRemaining = 2;
    await installMockApi(page, state);

    await page.goto("/app/send");

    await expect(
      page.getByRole("heading", { name: "What's the goal of this campaign?" }),
    ).toBeVisible();

    // ensureScraped() fired POST /api/brand-kit/scrape at wizard mount —
    // not only when Step 3 happens to render.
    await expect
      .poll(() => state.requestLog.scrapeRequests.length)
      .toBeGreaterThan(0);

    // The strip is visible while the scan is in flight.
    await expect(page.getByTestId("scrape-progress-strip")).toBeVisible();
    await expect(page.getByTestId("scrape-progress-strip")).toContainText(
      "alpha.example",
    );

    // The scripted progression settles the scan after a couple of polls
    // (2s each) — the strip disappears once scrapeStatus leaves "scraping".
    await expect(page.getByTestId("scrape-progress-strip")).toBeHidden({
      timeout: 10_000,
    });
  });

  test("a failed scan shows a dismissible warning strip with Try again", async ({
    page,
  }) => {
    const state = createMockAppState();
    state.brandKit.scrape_status = "pending";
    state.scrapePollsRemaining = 1;
    state.scrapeTerminalStatus = "failed";
    await installMockApi(page, state);

    await page.goto("/app/send");

    await expect(page.getByTestId("scrape-failed-strip")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId("scrape-failed-strip")).toContainText(
      "couldn't read your website",
    );

    const scrapesBeforeRetry = state.requestLog.scrapeRequests.length;
    await page.getByTestId("scrape-strip-retry").click();
    await expect
      .poll(() => state.requestLog.scrapeRequests.length)
      .toBeGreaterThan(scrapesBeforeRetry);

    // Dismissing hides the strip even though the (new) scan is scraping.
    await expect(page.getByTestId("scrape-progress-strip")).toBeVisible();
    await page.getByTestId("scrape-strip-dismiss").click();
    await expect(page.getByTestId("scrape-progress-strip")).toBeHidden();
  });

  test("an org without postcards access never triggers a scan or shows the strip", async ({
    page,
  }) => {
    const state = createMockAppState();
    (state.authMe as Record<string, unknown>).features = [];
    state.brandKit.scrape_status = "pending";
    await installMockApi(page, state);

    // Gated orgs are redirected off /app/send entirely (existing S85 gate,
    // feature-gate.spec.ts) — which alone guarantees zero scan calls since
    // the wizard never mounts. Confirm both halves hold together.
    await page.goto("/app/send");
    await expect(page).toHaveURL(/postcards-early-access/);
    expect(state.requestLog.scrapeRequests).toHaveLength(0);
    await expect(page.getByTestId("scrape-progress-strip")).toHaveCount(0);
  });
});

test.describe("AI scrape triggers — Business Info (Fix A)", () => {
  test.beforeEach(async ({ page }) => {
    const state = createMockAppState();
    // Start settled so ensureScraped/the strip stay out of the way; these
    // tests are about the explicit Business Info rescan path.
    state.brandKit.scrape_status = "complete";
    state.scrapePollsRemaining = 1;
    await installMockApi(page, state);
    (page as unknown as { __state: typeof state }).__state = state;
    await page.goto("/dev/step-design-fold");
    await page.getByTestId("toolbar-business").click();
    await expect(page.getByTestId("biz-website-input")).toBeVisible();
  });

  test("changing the website URL and saving triggers a rescan; an unchanged URL does not", async ({
    page,
  }) => {
    const state = (page as unknown as { __state: ReturnType<typeof createMockAppState> }).__state;

    await page.getByTestId("biz-website-input").fill("https://new-site.example");
    await page.getByTestId("biz-save").click();

    await expect
      .poll(() => state.requestLog.scrapeRequests.length)
      .toBe(1);
    expect(state.requestLog.scrapeRequests[0]?.website_url).toBe(
      "https://new-site.example",
    );

    // Save again with the SAME (now-current) url — no additional rescan.
    await expect(page.getByTestId("biz-save")).toBeDisabled();
    await page.getByTestId("biz-name-input").fill("Total Comfort Heating & Cooling Co");
    await page.getByTestId("biz-save").click();
    await page.waitForTimeout(300); // let a wrongly-fired rescan show up if it exists
    expect(state.requestLog.scrapeRequests).toHaveLength(1);
  });

  test("Rescan website fires a scan, disables while scraping, and shows Try again on failure", async ({
    page,
  }) => {
    const state = (page as unknown as { __state: ReturnType<typeof createMockAppState> }).__state;
    state.scrapePollsRemaining = 2;
    state.scrapeTerminalStatus = "failed";

    await expect(page.getByTestId("biz-rescan-website")).toBeEnabled();
    await page.getByTestId("biz-rescan-website").click();

    await expect(page.getByTestId("biz-rescan-website")).toBeDisabled();
    await expect(page.getByTestId("biz-rescan-website")).toHaveText("Scanning…");
    await expect(page.getByTestId("biz-rescan-progress")).toBeVisible();

    await expect(page.getByTestId("biz-rescan-failed")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId("biz-rescan-website")).toBeEnabled();
    await expect(page.getByTestId("biz-rescan-retry")).toBeVisible();
  });

  test("Rescan website is disabled when the website field is empty", async ({
    page,
  }) => {
    await page.getByTestId("biz-website-input").fill("");
    await page.getByTestId("biz-save").click();
    await expect(page.getByTestId("biz-rescan-website")).toBeDisabled();
  });
});
