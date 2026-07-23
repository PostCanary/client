// tests/e2e/feature-gate.spec.ts
// S85 postcards early-access gate: an org WITHOUT the "postcards" feature
// must not see the send/designs nav and must be redirected to the
// early-access page when hitting gated routes directly. An approved org
// (mock default) keeps the full experience.
import { expect, test, type Page } from "@playwright/test";
import { createMockAppState, installMockApi } from "./support/mockApi";

async function bootWithFeatures(page: Page, features: string[]) {
  const state = createMockAppState();
  (state.authMe as Record<string, unknown>).features = features;
  await installMockApi(page, state);
}

test.describe("postcards feature gate — unapproved org", () => {
  test.beforeEach(async ({ page }) => {
    await bootWithFeatures(page, []);
  });

  test("sidebar hides Send Postcards CTA and SEND MAIL section", async ({
    page,
  }) => {
    await page.goto("/app/home");
    await expect(page.getByRole("button", { name: "Home", exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send Postcards", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Designs", exact: true })).toHaveCount(0);
    // Ungated nav still present
    await expect(page.getByRole("button", { name: "Analytics", exact: true })).toBeVisible();
  });

  test("direct navigation to gated routes lands on early access", async ({
    page,
  }) => {
    for (const path of ["/app/designs", "/app/send", "/app/campaigns"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/postcards-early-access/);
      await expect(
        page.getByRole("button", { name: "Request an invite" }),
      ).toBeVisible();
    }
  });
});

test.describe("postcards feature gate — approved org", () => {
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
