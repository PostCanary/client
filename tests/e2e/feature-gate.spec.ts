// tests/e2e/feature-gate.spec.ts
// POS-292: Campaigns, Designs, and Send are GA. An org WITHOUT
// "postcards" in /auth/me features still reaches those surfaces.
// The invite wall at /app/postcards-early-access is gone.
import { expect, test, type Page } from "@playwright/test";
import { createMockAppState, installMockApi } from "./support/mockApi";

async function bootWithFeatures(page: Page, features: string[]) {
  const state = createMockAppState();
  (state.authMe as Record<string, unknown>).features = features;
  await installMockApi(page, state);
}

test.describe("postcards GA — org without features.postcards", () => {
  test.beforeEach(async ({ page }) => {
    await bootWithFeatures(page, []);
  });

  test("sidebar shows Send Postcards, Designs, and Campaigns", async ({
    page,
  }) => {
    await page.goto("/app/home");
    await expect(page.getByRole("button", { name: "Home", exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send Postcards", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Designs", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Campaigns", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Analytics", exact: true })).toBeVisible();
  });

  test("direct navigation to Campaigns, Designs, and Send stays on those routes", async ({
    page,
  }) => {
    const destinations: Array<[string, RegExp]> = [
      ["/app/campaigns", /\/app\/campaigns/],
      ["/app/designs", /\/app\/designs/],
      ["/app/send", /\/app\/send/],
    ];
    for (const [path, urlPattern] of destinations) {
      await page.goto(path);
      await expect(page).toHaveURL(urlPattern);
      await expect(page).not.toHaveURL(/postcards-early-access/);
      await expect(
        page.getByRole("button", { name: "Request an invite" }),
      ).toHaveCount(0);
      await expect(page.getByText("Postcard designs & sending are almost here")).toHaveCount(0);
    }
  });
});

test.describe("postcards GA — org with features.postcards", () => {
  test("keeps nav and reaches Designs", async ({ page }) => {
    await bootWithFeatures(page, ["postcards"]);
    await page.goto("/app/home");
    await expect(
      page.getByRole("button", { name: "Send Postcards", exact: true }),
    ).toBeVisible();
    await page.goto("/app/designs");
    await expect(page).toHaveURL(/\/app\/designs/);
  });
});
