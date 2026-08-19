// tests/e2e/home-quad-cards.spec.ts
// Dashboard Flow v2 (POS-145): the app homepage is four entry-point cards —
// Send Postcards / Browse Designs / Campaigns / Analytics — with wireframe
// copy, each navigating to its section. POS-292: all four cards show for
// every signed-in org, including orgs whose /auth/me omits "postcards".
import { expect, test, type Page } from "@playwright/test";
import { createMockAppState, installMockApi } from "./support/mockApi";

async function bootWithFeatures(page: Page, features: string[]) {
  const state = createMockAppState();
  (state.authMe as Record<string, unknown>).features = features;
  await installMockApi(page, state);
}

test.describe("home quad cards — approved org", () => {
  test.beforeEach(async ({ page }) => {
    await bootWithFeatures(page, ["postcards"]);
    await page.goto("/app/home");
  });

  test("shows all four cards with wireframe copy", async ({ page }) => {
    const grid = page.locator(".home-grid");
    await expect(grid.getByText("Send Postcards")).toBeVisible();
    await expect(grid.getByText("Launch a new campaign")).toBeVisible();
    await expect(grid.getByText("Browse Designs")).toBeVisible();
    await expect(grid.getByText("View your uploads")).toBeVisible();
    await expect(grid.getByText("Campaigns")).toBeVisible();
    await expect(grid.getByText("Track your previous mail sends")).toBeVisible();
    await expect(grid.getByText("Analytics")).toBeVisible();
    await expect(grid.getByText("Break down mail and CRM data")).toBeVisible();
    await expect(grid.locator(".home-card")).toHaveCount(4);
  });

  test("cards navigate to their sections", async ({ page }) => {
    const cases: Array<[string, RegExp]> = [
      ["Send Postcards", /\/app\/send/],
      ["Browse Designs", /\/app\/designs/],
      ["Campaigns", /\/app\/campaigns/],
      ["Analytics", /\/app\/analytics/],
    ];
    for (const [title, urlPattern] of cases) {
      await page.goto("/app/home");
      await page.locator(".home-card", { hasText: title }).click();
      await expect(page).toHaveURL(urlPattern);
    }
  });
});

test.describe("home quad cards — org without features.postcards", () => {
  test("still shows all four postcard-flow cards", async ({ page }) => {
    await bootWithFeatures(page, []);
    await page.goto("/app/home");
    const grid = page.locator(".home-grid");
    await expect(grid.getByText("Send Postcards")).toBeVisible();
    await expect(grid.getByText("Browse Designs")).toBeVisible();
    await expect(grid.getByText("Campaigns")).toBeVisible();
    await expect(grid.getByText("Analytics")).toBeVisible();
    await expect(grid.locator(".home-card")).toHaveCount(4);
  });
});
