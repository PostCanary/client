import { expect, test } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

function serviceTitanCsv() {
  return {
    name: "servicetitan-export.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Street,City,Region,Postal\n123 Peachtree St,Atlanta,GA,30309\n"),
  };
}

test("Sarah sees ServiceTitan audience headers flagged for mapping before suppression", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);
  await page.route("**/api/audiences", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    return route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error: "mapping_required",
        message: "ServiceTitan export needs column mapping.",
        batch_id: "audience-batch-sarah",
        source: "audience",
        missing: ["address1", "state", "zip"],
        sample_headers: ["Street", "City", "Region", "Postal"],
      }),
    });
  });

  await page.goto("/app/send/mock-draft-001/sttl-step-2");
  await page.getByTestId("sttl-file-input").setInputFiles(serviceTitanCsv());

  await expect(page.getByTestId("error-banner")).toContainText("Column mapping required");
  await expect(page.getByTestId("error-banner")).toContainText("address1, state, zip");
  await expect(page.getByTestId("suppression-strip")).toHaveCount(0);
  await expect.poll(() => state.requestLog.audienceSuppressions).toEqual([]);
});
