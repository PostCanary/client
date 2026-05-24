import { expect, test } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

function oversizedCsv() {
  return {
    name: "too-many-rows.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Address,City,State,ZIP\n".repeat(3)),
  };
}

test("SttL surfaces a row-cap warning and does not continue to suppression", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);
  await page.route("**/api/audiences", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    return route.fulfill({
      status: 413,
      contentType: "application/json",
      body: JSON.stringify({
        error: "row_cap_exceeded",
        message: "Row cap exceeded. Upload a list with 50,000 rows or fewer.",
      }),
    });
  });

  await page.goto("/app/send/mock-draft-001/sttl-step-2");
  await page.getByTestId("sttl-file-input").setInputFiles(oversizedCsv());

  await expect(page.getByTestId("error-banner")).toContainText("Row cap exceeded");
  await expect(page.getByTestId("suppression-strip")).toHaveCount(0);
  await expect.poll(() => state.requestLog.audienceSuppressions).toEqual([]);
});
