import { expect, test } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";
import { makeSolidPng } from "./support/pngFixture";

test("uploads, names, previews, details, and deletes a reusable design without a draft", async ({
  page,
}) => {
  const state = createMockAppState();
  await installMockApi(page, state);
  await page.goto("/app/designs");

  await expect(
    page.getByRole("main").getByRole("heading", { name: "Designs", exact: true }),
  ).toBeVisible();
  await page.getByTestId("upload-design").click();

  const expectedDefaultName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  await expect(page.getByTestId("design-name-input")).toHaveValue(expectedDefaultName);
  await page.getByTestId("design-name-input").fill("Reusable July postcard");
  await page.getByTestId("design-front-input").setInputFiles({
    name: "front.png",
    mimeType: "image/png",
    buffer: makeSolidPng(1875, 2775),
  });
  await page.getByTestId("save-design").click();

  await expect(page.getByTestId("design-detail")).toContainText("Reusable July postcard");
  await expect(page.getByTestId("blank-back-state")).toHaveText("Blank back");
  await expect(page.getByTestId("design-front-thumbnail")).toBeVisible();
  expect(state.requestLog.designUploads).toHaveLength(1);
  expect(state.requestLog.designCreates).toHaveLength(1);
  expect(state.requestLog.draftCreates).toBe(0);

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete design" }).click();
  await expect(page.getByTestId("design-front-thumbnail")).toHaveCount(0);
  expect(state.requestLog.designDeletes).toEqual(["saved-design-1"]);
});

test("keeps curated templates and their existing wizard handoff", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);
  await page.goto("/app/designs");

  await expect(page.getByTestId("design-library-template")).toHaveCount(3);
  const offerTemplate = page
    .getByTestId("design-library-template")
    .filter({ hasText: "HVAC Neighborhood Offer" });
  await expect(offerTemplate.getByText("hac-1000-front-v1")).toBeVisible();
  await offerTemplate.getByRole("button", { name: "Send this Postcard" }).click();

  await expect(page).toHaveURL(
    /\/app\/send\?templateId=hvac-hac-1000-full-bleed-offer-v1&goal=neighbor_marketing$/,
  );
  expect(state.requestLog.draftCreates).toBe(0);
  // Flow v2 (POS-146): Step 1 is now the two-option audience choice.
  await expect(page.getByTestId("choose-target-area")).toBeVisible();
  expect(state.requestLog.draftCreates).toBe(0);
});

test("keeps Download PDF hidden until a curated template has a real asset", async ({
  page,
}) => {
  const state = createMockAppState();
  await installMockApi(page, state);
  await page.goto("/app/designs");

  const cards = page.getByTestId("design-library-template");
  await expect(cards).toHaveCount(3);
  await expect(cards.getByRole("button", { name: "Download PDF" })).toHaveCount(0);
});
