import { expect, test } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

test("Step 1 shows Send to a List in position 2 and opens the SttL route", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);

  await page.goto("/app/send");
  await page.getByPlaceholder("Scottsdale, AZ").fill("Atlanta, GA");
  await page.getByRole("button", { name: "Roofing" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "What's the goal of this campaign?" })).toBeVisible();

  const primaryCards = page.locator(".goal-card").filter({ hasNot: page.getByText("Coming Soon") });
  await expect(primaryCards.nth(0)).toContainText("Neighbor Marketing");
  await expect(primaryCards.nth(1)).toContainText("Send to a List");
  await expect(primaryCards.nth(1)).toContainText("Already have customers? Mail them.");
  await expect(primaryCards.nth(2)).toContainText("Target an Area");

  await page.getByRole("button", { name: /More options/ }).click();
  await expect(page.locator(".goal-card")).toHaveCount(8);

  await primaryCards.nth(1).click();

  await expect(page).toHaveURL(/\/app\/send\/mock-draft-001\/sttl-step-2$/);
  await expect(page.getByRole("heading", { name: "Upload your audience CSV" })).toBeVisible();
});
