import { expect, test } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

function csvFile() {
  return {
    name: "audience.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Address,City,State,ZIP\n123 Peachtree St,Atlanta,GA,30309\n"),
  };
}

test("SttL Step 2 route uploads, suppresses, prices, and approves an audience", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);

  await page.goto("/app/send/mock-draft-001/sttl-step-2");

  await expect(page.getByRole("heading", { name: "Upload your audience CSV" })).toBeVisible();
  await page.getByTestId("sttl-file-input").setInputFiles(csvFile());

  await expect(page.getByTestId("suppression-strip")).toBeVisible({ timeout: 8000 });
  await expect.poll(() => state.requestLog.audienceSuppressions).toEqual(["audience-alpha"]);
  await expect(page.getByTestId("approve-btn")).toBeEnabled({ timeout: 45000 });

  await page.getByTestId("approve-btn").click();

  await expect(page.getByTestId("sttl-approved-banner")).toBeVisible({ timeout: 60000 });
  await expect.poll(() => state.requestLog.audienceApprovals).toEqual(["audience-alpha"]);
});
