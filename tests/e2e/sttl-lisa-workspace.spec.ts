import { expect, test } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

function lisaCsv() {
  return {
    name: "lisa-first-audience.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Address,City,State,ZIP\n42 Market St,Charleston,SC,29401\n"),
  };
}

test("Lisa sees the empty upload state and completes her first audience upload", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);

  await page.goto("/app/send/sttl-step-2");

  await expect(page.getByTestId("sttl-upload-dropzone")).toContainText("Drop CSV here or choose a file");
  await expect(page.getByTestId("sttl-file-input")).toHaveCount(1);

  await page.getByTestId("sttl-file-input").setInputFiles(lisaCsv());

  await expect(page.getByText("No address points to display")).toBeVisible();
  await expect(page.getByTestId("suppression-strip")).toContainText("482 deliverable");
  await expect(page.getByTestId("approve-btn")).toBeEnabled();
});
