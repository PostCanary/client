/**
 * wizard-approve-flow.spec.ts — MC.5 deferred E2E spec
 *
 * Core criterion: clicking "Approve & Send Card 1" on Step 4 calls
 * POST /api/mail-campaigns and gets a 200 response (NOT 404).
 * MC.1-MC.6 fixed the 404; this spec is the regression guard.
 *
 * Auth: reuses .auth/live.json from auth.setup.ts (same dev account
 * as emma-regression, bob-first-campaign, etc.).
 * Stack: Docker on :8080 (nginx → api + client).
 *
 * Fix history:
 *   v1: spec timed out (30s) — browser DID reach step 4 but 30s exhausted.
 *   v2: bumped timeout to 90s; must check terms checkbox before button enables.
 */

import { test, expect } from "@playwright/test";

test.use({
  baseURL: "http://localhost:8080",
  storageState: ".auth/live.json",
});

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;

test.describe("wizard approve flow — MC 404-fix regression guard", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
  });

  test("Approve & Send Card 1 calls POST /api/mail-campaigns → 200", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);

    // --- Track POST /api/mail-campaigns ---
    let campaignApiStatus: number | null = null;
    let campaignApiBody: string | null = null;
    page.on("response", (response) => {
      if (
        response.request().method() === "POST" &&
        response.url().includes("/api/mail-campaigns") &&
        !response.url().includes("/api/mail-campaigns/")
      ) {
        campaignApiStatus = response.status();
      }
    });
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().includes("/api/mail-campaigns") &&
        !request.url().includes("/api/mail-campaigns/")
      ) {
        campaignApiBody = request.postData();
      }
    });

    // --- Step 1: Auto-create draft ---
    await page.goto("/app/send");
    await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });
    const draftId = page.url().match(DRAFT_URL_RE)?.[1];
    expect(draftId, "Draft ID must be extracted from URL").toBeTruthy();

    // Step 1: select goal then Next
    const nextBtn = page.getByRole("button", { name: "Next", exact: true });
    await expect(nextBtn, "Next button on Step 1").toBeVisible({ timeout: 15_000 });

    const goalCards = page.locator('[data-testid="goal-card"], .goal-card, button:has-text("Neighbor Marketing")');
    const firstGoal = goalCards.first();
    if (await firstGoal.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await firstGoal.click();
    }
    await nextBtn.click();

    // --- Step 2: Targeting ---
    await page.waitForTimeout(2_000);
    const nextBtn2 = page.getByRole("button", { name: "Next", exact: true });
    const nextEnabled2 = await nextBtn2.isEnabled({ timeout: 5_000 }).catch(() => false);
    if (!nextEnabled2) {
      const zipInput = page.getByPlaceholder(/zip|postal/i).first();
      if (await zipInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await zipInput.fill("90210");
        await zipInput.press("Enter");
        await page.waitForTimeout(1_500);
      }
    }
    await nextBtn2.click({ timeout: 10_000 });

    // --- Step 3: Design ---
    await page.waitForTimeout(2_000);
    const nextBtn3 = page.getByRole("button", { name: "Next", exact: true });
    await expect(nextBtn3, "Next button on Step 3 (Design)").toBeVisible({ timeout: 15_000 });
    await nextBtn3.click();

    // --- Step 4: Review ---
    await page.waitForTimeout(3_000);

    // Terms checkbox must be checked before the Approve button enables.
    const termsCheckbox = page.getByRole("checkbox", {
      name: /I confirm all information/i,
    });
    await expect(termsCheckbox, "Terms checkbox on Step 4").toBeVisible({ timeout: 15_000 });
    if (!(await termsCheckbox.isChecked())) {
      await termsCheckbox.click();
    }

    const approveBtn = page.getByRole("button", { name: /Approve & Send Card 1/i });
    await expect(approveBtn, "Approve button enabled after terms checked").toBeEnabled({ timeout: 5_000 });

    await page.screenshot({ path: testInfo.outputPath("step4_before_approve.png"), fullPage: true });

    // --- Click Approve ---
    await approveBtn.click();

    // Wait for POST to complete
    await page.waitForTimeout(6_000);

    await page.screenshot({ path: testInfo.outputPath("step4_after_approve.png"), fullPage: true });

    // Primary assertion: 200 not 404
    expect(
      campaignApiStatus,
      `POST /api/mail-campaigns returned ${campaignApiStatus} — expected 200. MC.1-MC.6 should have fixed the 404.`,
    ).toBe(200);

    // Secondary: request body included draft_id
    expect(campaignApiBody, "POST body must include draft_id").toContain("draft_id");

    // Tertiary: success banner visible
    const successIndicator = page.locator(
      '[data-testid="campaign-approved"], :text("Your campaign is live"), :text("Campaign approved"), :text("Approving")',
    );
    await expect(successIndicator.first()).toBeVisible({ timeout: 10_000 });
  });
});
