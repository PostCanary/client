import { expect, test } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

function repeatedCsv() {
  return {
    name: "existing-audience.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Address,City,State,ZIP\n123 Peachtree St,Atlanta,GA,30309\n"),
  };
}

test("SttL re-upload dedup uses the existing audience idempotently", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);
  await page.route("**/api/audiences", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        audience: {
          id: "audience-existing",
          org_id: "org-alpha",
          user_id: "user-owner",
          workspace_id: null,
          name: "Existing Audience",
          status: "uploaded",
          batch_id: "audience-batch-existing",
          created_at: "2026-03-23T00:00:00Z",
          approved_at: null,
          uploaded_count: 500,
          deliverable_count: 482,
        },
        re_upload_prompt: true,
      }),
    });
  });
  await page.route("**/api/audiences/audience-existing/suppress", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    state.requestLog.audienceSuppressions.push("audience-existing");
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        audience_id: "audience-existing",
        uploaded_count: 500,
        suppressed: { dnm: 10, past_customer: 5, recently_mailed: 3, total_suppressed: 18 },
        deliverable_count: 482,
        precedence: ["dnm", "past_customer", "recently_mailed"],
      }),
    });
  });
  await page.route("**/api/audiences/audience-existing/cost", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        audience_id: "audience-existing",
        deliverable_count: 482,
        per_card_cost_cents: 69,
        per_card_subtotal_cents: 33258,
        enrich_enabled: false,
        melissa_enrich_estimate_cents: null,
        total_cents: 33258,
      }),
    });
  });
  await page.route("**/api/audiences/audience-existing/approve", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    state.requestLog.audienceApprovals.push("audience-existing");
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        audience_id: "audience-existing",
        status: "approved",
        campaign_id: "mock-draft-001",
        approved_at: "2026-03-23T00:02:00Z",
      }),
    });
  });

  await page.goto("/app/send/mock-draft-001/sttl-step-2");
  await page.getByTestId("sttl-file-input").setInputFiles(repeatedCsv());

  await expect(page.getByTestId("suppression-strip")).toContainText("482 deliverable");
  await page.getByTestId("approve-btn").click();

  await expect.poll(() => state.requestLog.audienceSuppressions).toEqual(["audience-existing"]);
  await expect.poll(() => state.requestLog.audienceApprovals).toEqual(["audience-existing"]);
});
