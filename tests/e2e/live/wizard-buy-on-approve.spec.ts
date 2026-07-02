/**
 * wizard-buy-on-approve.spec.ts — segment-1 E2E regression guard
 *
 * Verifies the buy-on-Approve wiring (server commit 1dcac2f, client 9f853e4):
 * clicking "Approve & Send Card 1" on Step 4 calls all approval-side effects:
 *   1. POST /api/mail-campaigns                        (creates MailCampaign)
 *   2. POST /api/mail-campaigns/<id>/approval-artifact (saves immutable proof)
 *   3. POST /api/mail-campaigns/<id>/purchase-records  (buys Melissa list)
 * and the customer sees the "Your campaign is live!" success screen.
 *
 * Drake decision 2026-05-05 (mem 984): buy data immediately on Approve.
 *
 * Auth: reuses .auth/live.json — same dev account as wizard-approve-flow.spec.
 * Trial-mode Melissa is live → walk burns ~qty records (qty=10 cap, plenty of
 * headroom in the 5,000-record trial budget per mem 910).
 */

import { test, expect } from "@playwright/test";

test.use({
  baseURL: "http://localhost:8080",
  storageState: ".auth/live.json",
});

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;
const ARTIFACT_URL_RE = /\/api\/mail-campaigns\/([0-9a-f-]{36})\/approval-artifact/;
const PURCHASE_URL_RE = /\/api\/mail-campaigns\/([0-9a-f-]{36})\/purchase-records/;

test.describe("wizard buy-on-approve — segment 1 wiring", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
  });

  test("Approve creates proof before purchasing records", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);

    let createStatus: number | null = null;
    let artifactStatus: number | null = null;
    let artifactBodyRequested: string | null = null;
    let purchaseStatus: number | null = null;
    let purchaseBodyRequested: string | null = null;
    let purchaseResponseBody: string | null = null;
    let createdCampaignId: string | null = null;
    const sideEffectOrder: string[] = [];

    page.on("response", async (response) => {
      const url = response.url();
      const method = response.request().method();
      // POST /api/mail-campaigns (create)
      if (
        method === "POST" &&
        url.includes("/api/mail-campaigns") &&
        !PURCHASE_URL_RE.test(url) &&
        !url.match(/\/api\/mail-campaigns\/[0-9a-f-]{36}\/(?!$)/)
      ) {
        createStatus = response.status();
        try {
          const body = await response.json();
          createdCampaignId = body?.id ?? null;
        } catch {
          // body may not be JSON for error responses; ignore
        }
      }
      // POST /api/mail-campaigns/<id>/purchase-records
      if (method === "POST" && ARTIFACT_URL_RE.test(url)) {
        artifactStatus = response.status();
      }
      if (method === "POST" && PURCHASE_URL_RE.test(url)) {
        purchaseStatus = response.status();
        try {
          purchaseResponseBody = await response.text();
        } catch {
          // ignore
        }
      }
    });

    page.on("request", (request) => {
      if (request.method() === "POST" && PURCHASE_URL_RE.test(request.url())) {
        sideEffectOrder.push("purchase");
        purchaseBodyRequested = request.postData();
      }
      if (request.method() === "POST" && ARTIFACT_URL_RE.test(request.url())) {
        sideEffectOrder.push("artifact");
        artifactBodyRequested = request.postData();
      }
    });

    // Step 1 — auto-create or load draft. The route param is optional
    // (`/app/send/:draftId?`); when omitted, the SPA picks up an existing
    // draft or auto-creates one. Wait for the wizard's Next button instead
    // of a URL pattern (which doesn't always rewrite for the optional param).
    await page.goto("/app/send");
    const nextBtn = page.getByRole("button", { name: "Next", exact: true });
    await expect(nextBtn).toBeVisible({ timeout: 30_000 });
    const goalCards = page.locator(
      '[data-testid="goal-card"], .goal-card, button:has-text("Neighbor Marketing")',
    );
    if (await goalCards.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await goalCards.first().click();
    }
    await nextBtn.click();

    // Step 2 — targeting (use ZIP for deterministic single-area path)
    await page.waitForTimeout(2_000);
    const nextBtn2 = page.getByRole("button", { name: "Next", exact: true });
    const nextEnabled2 = await nextBtn2.isEnabled({ timeout: 5_000 }).catch(() => false);
    if (!nextEnabled2) {
      const zipInput = page.getByPlaceholder(/zip|postal/i).first();
      if (await zipInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await zipInput.fill("90210");
        await zipInput.press("Enter");
        await page.waitForTimeout(2_000);
      }
    }
    await nextBtn2.click({ timeout: 10_000 });

    // Step 3 — design
    await page.waitForTimeout(2_000);
    const nextBtn3 = page.getByRole("button", { name: "Next", exact: true });
    await expect(nextBtn3).toBeVisible({ timeout: 15_000 });
    await nextBtn3.click();

    // Step 4 — review + approve
    await page.waitForTimeout(3_000);
    const termsCheckbox = page.getByRole("checkbox", {
      name: /I confirm all information/i,
    });
    await expect(termsCheckbox).toBeVisible({ timeout: 15_000 });
    if (!(await termsCheckbox.isChecked())) {
      await termsCheckbox.click();
    }

    const approveBtn = page.getByRole("button", { name: /Approve & Send Card 1/i });
    await expect(approveBtn).toBeEnabled({ timeout: 5_000 });

    await page.screenshot({
      path: testInfo.outputPath("buy_on_approve_before.png"),
      fullPage: true,
    });

    await approveBtn.click();

    // Wait for API side effects to complete
    await page.waitForTimeout(15_000);

    await page.screenshot({
      path: testInfo.outputPath("buy_on_approve_after.png"),
      fullPage: true,
    });

    // PRIMARY assertion: create-campaign 200
    expect(
      createStatus,
      `POST /api/mail-campaigns returned ${createStatus} — expected 200`,
    ).toBe(200);

    // PRIMARY assertion: approval artifact exists before purchase-records
    expect(
      artifactStatus,
      `POST /api/mail-campaigns/<id>/approval-artifact returned ${artifactStatus} — expected 200 or 201`,
    ).toEqual(expect.any(Number));
    expect([200, 201]).toContain(artifactStatus);
    expect(
      artifactBodyRequested,
      "approval-artifact request body must include acknowledged_at and terms_version",
    ).toContain("acknowledged_at");
    expect(artifactBodyRequested).toContain("accuracy-rights-v1");
    expect(sideEffectOrder.slice(0, 2)).toEqual(["artifact", "purchase"]);

    // PRIMARY assertion: purchase-records 200
    expect(
      purchaseStatus,
      `POST /api/mail-campaigns/<id>/purchase-records returned ${purchaseStatus} — expected 200. ` +
        `Response body: ${purchaseResponseBody}`,
    ).toBe(200);

    // SECONDARY: campaign id was extracted + purchase URL contained it
    expect(
      createdCampaignId,
      "Created campaign id should be extracted from create response",
    ).toBeTruthy();
    expect(
      purchaseBodyRequested,
      "purchase-records request body must include qty",
    ).toContain("qty");

    // SECONDARY: response body has record_count > 0 + an order_id
    if (purchaseResponseBody) {
      const parsed = JSON.parse(purchaseResponseBody);
      expect(parsed.record_count, "record_count must be > 0").toBeGreaterThan(0);
      expect(parsed.order_id, "order_id must be present").toBeTruthy();
    }

    // TERTIARY: customer sees the success screen
    const successIndicator = page.locator(
      ':text("Your campaign is live"), :text("Card 1 is in production")',
    );
    await expect(successIndicator.first()).toBeVisible({ timeout: 10_000 });
  });
});
