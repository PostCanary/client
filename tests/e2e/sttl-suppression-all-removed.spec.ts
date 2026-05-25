import { expect, test } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

function dnmCsv() {
  return {
    name: "all-dnm.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Address,City,State,ZIP\n1 Old Rd,Atlanta,GA,30309\n"),
  };
}

test("SttL shows a 100 percent suppression result without double-counting", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);
  await page.route("**/api/audiences/audience-alpha/suppress", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    state.requestLog.audienceSuppressions.push("audience-alpha");
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        audience_id: "audience-alpha",
        uploaded_count: 500,
        suppressed: {
          dnm: 500,
          past_customer: 0,
          recently_mailed: 0,
          total_suppressed: 500,
        },
        deliverable_count: 0,
        precedence: ["dnm", "past_customer", "recently_mailed"],
      }),
    });
  });
  await page.route("**/api/audiences/audience-alpha/cost", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        audience_id: "audience-alpha",
        deliverable_count: 0,
        per_card_cost_cents: 69,
        per_card_subtotal_cents: 0,
        enrich_enabled: false,
        melissa_enrich_estimate_cents: null,
        total_cents: 0,
      }),
    });
  });

  await page.goto("/app/send/mock-draft-001/sttl-step-2");
  await page.getByTestId("sttl-file-input").setInputFiles(dnmCsv());

  await expect(page.getByTestId("suppression-strip")).toContainText("500 uploaded");
  await expect(page.getByTestId("suppression-strip")).toContainText("500 removed");
  await expect(page.getByTestId("suppression-strip")).toContainText("DNM ×500");
  await expect(page.getByTestId("suppression-strip")).toContainText("0 deliverable");
  await expect(page.getByTestId("enrich-cost-block")).toContainText("$0.00");
});
