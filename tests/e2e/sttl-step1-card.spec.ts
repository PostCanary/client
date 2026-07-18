// Flow v2 (POS-146): Step 1 is the two-option audience choice — Target an
// Area / Send to a List — with wireframe copy. Each option maps to its
// existing goal type under the hood (target_area / send_to_list).
import { expect, test } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

test("Step 1 shows the two audience options; Send to a List opens the SttL route", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);

  await page.goto("/app/send");

  const areaOption = page.getByTestId("choose-target-area");
  const listOption = page.getByTestId("choose-send-to-list");
  await expect(areaOption).toBeVisible();
  await expect(areaOption).toContainText("Target an Area");
  await expect(areaOption).toContainText("Pick any Neighborhood on the map.");
  await expect(listOption).toBeVisible();
  await expect(listOption).toContainText("Send to a List");
  await expect(listOption).toContainText("Mail to a list you already have.");

  await listOption.click();

  await expect(page).toHaveURL(/\/app\/send\/mock-draft-001\/sttl-step-2$/);
  await expect(page.getByRole("heading", { name: "Upload your audience CSV" })).toBeVisible();
});

test("Target an Area commits the goal and advances to the map step", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);

  await page.goto("/app/send");
  await page.getByTestId("choose-target-area").click();

  // Step 2 of the wizard — progress bar highlights "Pick Your Area"
  await expect(page.getByRole("button", { name: /Pick Your Area/ })).toBeVisible();
  await expect(page.getByTestId("choose-target-area")).toHaveCount(0);
});
