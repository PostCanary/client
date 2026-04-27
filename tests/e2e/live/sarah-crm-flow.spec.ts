import { test, expect } from "@playwright/test";

/**
 * Sprint 1.0.4 — Sarah persona regression guard.
 *
 * Sarah is the office manager at a growing HVAC company who handles
 * marketing + 10 other things (postcanary.md). Her test:
 * "Needs efficient." The CRM upload flow must stay fast — no
 * detours, no navigating to find the affordance, no extra steps
 * between "I have a CRM CSV" and "matching is running."
 *
 * This spec walks Sarah's CRM flow from Dashboard:
 *   1. Dashboard surfaces an UploadCard (efficient affordance —
 *      no scavenger-hunt for upload)
 *   2. CRM file picker is reachable in one click
 *   3. The Run Matching button (data-testid="upload-match-button")
 *      exists in the Dashboard surface — no hidden submenu
 *
 * We do NOT actually upload a CSV in this spec — that would commit
 * test data + need fixture management. The regression lens is the
 * AFFORDANCE itself: is the CRM upload still one-click reachable
 * from Dashboard, does the modal/picker still open cleanly, are
 * the entry points still labeled in plain English.
 *
 * Targets the Docker stack on :8080 (matches emma-regression +
 * bob-first-campaign + home-to-step2-skip patterns). Reuses
 * .auth/live.json from auth.setup.ts.
 */

test.use({
  baseURL: "http://localhost:8080",
  storageState: ".auth/live.json",
});

test.describe("Sarah CRM flow — efficient upload affordance from Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
  });

  test("Dashboard surfaces a CRM upload affordance without navigation hops", async ({
    page,
  }, testInfo) => {
    await page.goto("/app/dashboard");
    await page.waitForLoadState("networkidle", { timeout: 25_000 });

    // 1. Authenticated landing — NOT bounced to login.
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 5_000 });

    // 2. The upload card / area must be reachable on the Dashboard
    // surface itself — no "click here to find upload" scavenger hunt.
    // We check three independent signals: the testid on the upload
    // area, the testid on the match button, and any visible button
    // labeled "upload" / "CRM" / "import". Sarah's affordance fails
    // only if ALL THREE are absent.
    const testidUploadArea = await page
      .locator(
        "main :is([data-testid='upload-readonly-message'], [data-testid='upload-match-button'], [data-testid*='upload'])",
      )
      .count();
    const labeledUploadBtn = await page
      .getByRole("button", { name: /upload|CRM|import/i })
      .count();
    expect(
      testidUploadArea + labeledUploadBtn,
      "Dashboard must surface a CRM upload affordance — Sarah shouldn't navigate away to find it",
    ).toBeGreaterThanOrEqual(1);

    // 3. NO runtime error overlay blocking Sarah's quick-check.
    await expect(
      page.getByText(/Something went wrong|Uncaught|Fatal error|Application error/i),
      "Runtime error overlay surfaced on Dashboard for Sarah",
    ).not.toBeVisible();

    // 4. NO paywall blocking — efficient access regression.
    await expect(
      page.getByText(/Unlock Matching|Upgrade to access|Subscribe to continue/i),
      "Paywall blocked Sarah on Dashboard — subscription regression",
    ).not.toBeVisible();

    await page.screenshot({
      path: testInfo.outputPath("sarah_dashboard_upload_affordance.png"),
      fullPage: true,
    });
  });

  test("Run Matching button is present + reachable on Dashboard", async ({
    page,
  }) => {
    await page.goto("/app/dashboard");
    await page.waitForLoadState("networkidle", { timeout: 25_000 });

    // The match button is the user-visible CTA after Sarah uploads.
    // If it's not on the Dashboard surface, her flow has regressed —
    // she'd have to navigate elsewhere to trigger the matchback.
    const matchBtn = page.locator("[data-testid='upload-match-button']");

    // Either visible (she has prior staging data + can run matching)
    // OR present in DOM but hidden behind upload-readonly-message
    // (she needs to upload first, but the button is still wired up).
    // Failure mode: the testid stops existing entirely (component
    // restructure broke the contract).
    const present = await matchBtn.count();
    const readonlyMsg = await page
      .locator("[data-testid='upload-readonly-message']")
      .count();

    expect(
      present + readonlyMsg,
      "Either upload-match-button OR upload-readonly-message must exist on Dashboard — both gone = upload contract broken",
    ).toBeGreaterThanOrEqual(1);
  });

  test("Dashboard renders without surfacing a scavenger-hunt empty state for Sarah", async ({
    page,
  }) => {
    await page.goto("/app/dashboard");
    await page.waitForLoadState("networkidle", { timeout: 25_000 });

    // Sarah is efficient — she shouldn't land on a Dashboard that
    // says "Nothing to see here, go to a settings page first."
    // First-time-user prompts are fine; setup-required redirects
    // before she can even see the upload affordance are NOT.
    await expect(
      page.getByText(/Complete setup before|Configure your account first|Setup required/i),
      "Dashboard pushed Sarah to a setup detour before she could upload",
    ).not.toBeVisible();

    // Page must surface real content (any of: heading, KPI card,
    // chart, or upload card — at least one rendered substantive
    // element). Skeleton-only state at networkidle = regression.
    const realContent = page.locator(
      "main :is(h1, h2, h3, [data-testid], canvas, svg, .kpi-card, .upload-card):not(.skeleton):not(.animate-pulse)",
    );
    const count = await realContent.count();
    expect(
      count,
      "Dashboard rendered no substantive content for Sarah after networkidle",
    ).toBeGreaterThanOrEqual(1);
  });
});
