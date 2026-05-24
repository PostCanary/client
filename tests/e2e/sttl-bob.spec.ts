import { expect, test } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

function bobCsv() {
  return {
    name: "bob-audience.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Address,City,State,ZIP\n123 Peachtree St,Atlanta,GA,30309\n"),
  };
}

test("Bob can upload, suppress, price, and approve within performance budgets", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);

  await page.goto("/app/send/mock-draft-001/sttl-step-2");
  await expect(page.getByRole("heading", { name: "Upload your audience CSV" })).toBeVisible();

  const started = performance.now();
  await page.getByTestId("sttl-file-input").setInputFiles(bobCsv());

  await expect(page.getByTestId("suppression-strip")).toBeVisible({ timeout: 8000 });
  const autoDetectMs = performance.now() - started;
  expect(autoDetectMs).toBeLessThanOrEqual(8000);

  await expect(page.getByTestId("suppression-strip")).toContainText("18 removed", { timeout: 30000 });
  const suppressionMs = performance.now() - started;
  expect(suppressionMs).toBeLessThanOrEqual(30000);

  await expect(page.getByTestId("enrich-cost-block")).toContainText("$332.58", { timeout: 45000 });
  const costMs = performance.now() - started;
  expect(costMs).toBeLessThanOrEqual(45000);

  await expect(page.getByTestId("approve-btn")).toBeEnabled({ timeout: 60000 });
  const approveEnabledMs = performance.now() - started;
  expect(approveEnabledMs).toBeLessThanOrEqual(60000);

  await page.getByTestId("approve-btn").click();
  await expect(page.getByTestId("sttl-approved-banner")).toBeVisible();
  await expect.poll(() => state.requestLog.audienceApprovals).toEqual(["audience-alpha"]);
});
