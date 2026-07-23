// Flow v2 (POS-146): Step 1 is the two-option audience choice — Target an
// Area / Send to a List — with wireframe copy. Each option maps to its
// existing goal type under the hood (target_area / send_to_list).
import { expect, test } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

test("new campaign stays unpersisted through both Step 1 audience choices", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);

  await page.goto("/app/send");
  expect(state.requestLog.draftCreates).toBe(0);

  const areaOption = page.getByTestId("choose-target-area");
  const listOption = page.getByTestId("choose-send-to-list");
  await expect(areaOption).toBeVisible();
  await expect(areaOption).toContainText("Target an Area");
  await expect(areaOption).toContainText("Pick any Neighborhood on the map.");
  await expect(listOption).toBeVisible();
  await expect(listOption).toContainText("Send to a List");
  await expect(listOption).toContainText("Mail to a list you already have.");

  await listOption.click();

  await expect(page).toHaveURL(/\/app\/send\/sttl-step-2$/);
  expect(state.requestLog.draftCreates).toBe(0);
  await expect(page.getByRole("heading", { name: "Upload your audience CSV" })).toBeVisible();
  await expect(page.getByTestId("wizard-logo")).toBeVisible();
  await expect(page.getByTitle("Save and exit")).toBeVisible();
  await expect(page.getByRole("button", { name: /Pick Your Area/ })).toBeVisible();
});

test("pre-Step-3 Save and exit warns with the approved copy and does not persist", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);

  await page.goto("/app/send");
  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("confirm");
    expect(dialog.message()).toBe(
      "Do you want to exit? Campaigns are only saved once you've arrived at step 3.",
    );
    await dialog.accept();
  });
  await page.getByTestId("wizard-logo").click();
  await expect(page).toHaveURL(/\/app\/home$/);
  expect(state.requestLog.draftCreates).toBe(0);

  await page.goto("/app/send");
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toBe(
      "Do you want to exit? Campaigns are only saved once you've arrived at step 3.",
    );
    await dialog.accept();
  });
  await page.getByTitle("Save and exit").click();
  await expect(page).toHaveURL(/\/app\/home$/);
  expect(state.requestLog.draftCreates).toBe(0);
});

test("browser back and refresh before Step 3 discard without persisting", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);

  await page.goto("/app/home");
  await page.goto("/app/send");
  await page.getByTestId("choose-target-area").click();
  expect(state.requestLog.draftCreates).toBe(0);

  await page.goBack();
  await expect(page).toHaveURL(/\/app\/home$/);
  expect(state.requestLog.draftCreates).toBe(0);

  await page.goto("/app/send");
  await page.getByTestId("choose-send-to-list").click();
  await page.reload();
  // The in-memory route state is gone, so refresh returns to a clean Step 1.
  await expect(page.getByTestId("choose-send-to-list")).toBeVisible();
  expect(state.requestLog.draftCreates).toBe(0);
});

test("only the hovered audience option is highlighted", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);

  await page.goto("/app/send");
  const areaOption = page.getByTestId("choose-target-area");
  const listOption = page.getByTestId("choose-send-to-list");
  const teal = "rgb(71, 191, 169)";
  const white = "rgb(255, 255, 255)";

  await expect(areaOption).toHaveCSS("background-color", white);
  await expect(listOption).toHaveCSS("background-color", white);

  await areaOption.hover();
  await expect(areaOption).toHaveCSS("background-color", teal);
  await expect(listOption).toHaveCSS("background-color", white);

  await listOption.hover();
  await expect(listOption).toHaveCSS("background-color", teal);
  await expect(areaOption).toHaveCSS("background-color", white);
});

test("Target an Area commits the goal and advances to the map step", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);

  await page.goto("/app/send");
  await page.getByTestId("choose-target-area").click();

  // Step 2 of the wizard — progress bar highlights "Pick Your Area"
  await expect(page.getByRole("button", { name: /Pick Your Area/ })).toBeVisible();
  await expect(page.getByTestId("choose-target-area")).toHaveCount(0);
  expect(state.requestLog.draftCreates).toBe(0);
});
