import { expect, test, type Page } from "@playwright/test";
import { createMockAppState, installMockApi } from "./support/mockApi";

const PENDING = {
  id: "11111111-1111-4111-8111-111111111111",
  org_id: "org-alpha",
  org_name: "Acme HVAC",
  asset_id: "22222222-2222-4222-8222-222222222222",
  asset_url: "/media/design-uploads/org-alpha/hero.png",
  filename: "hero.png",
  mime_type: "image/png",
  moderation_status: "pending",
  rejection_reason: null,
  reviewed_by: null,
  reviewed_at: null,
  uploaded_at: "2026-08-22T11:48:00.000Z",
};

async function installModerationRoutes(
  page: Page,
  store: { uploads: typeof PENDING[]; role: string },
) {
  await page.route("**/api/admin/design-moderation/pending*", async (route) => {
    if (store.role !== "superadmin") {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          error: { type: "Unauthorized", message: "superadmin required" },
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        uploads: store.uploads,
        page: 1,
        per_page: 25,
      }),
    });
  });

  await page.route("**/api/admin/design-moderation/*/approve", async (route) => {
    const id = route.request().url().split("/").at(-2);
    store.uploads = store.uploads.filter((item) => item.id !== id);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...PENDING, moderation_status: "approved" }),
    });
  });

  await page.route("**/api/admin/design-moderation/*/reject", async (route) => {
    const body = route.request().postDataJSON() as { reason?: string };
    if (!body?.reason?.trim()) {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: { type: "BadRequest", message: "reason is required" },
        }),
      });
      return;
    }
    const id = route.request().url().split("/").at(-2);
    store.uploads = store.uploads.filter((item) => item.id !== id);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...PENDING,
        moderation_status: "rejected",
        rejection_reason: body.reason,
      }),
    });
  });
}

test.describe("admin design moderation", () => {
  test("superadmin can approve a pending upload", async ({ page }) => {
    const state = createMockAppState();
    state.authMe.role = "superadmin";
    await installMockApi(page, state);
    const store = { uploads: [{ ...PENDING }], role: "superadmin" };
    await installModerationRoutes(page, store);

    await page.goto("/app/admin/moderation");
    await expect(page.getByTestId("admin-design-moderation")).toBeVisible();
    await expect(page.getByText("Acme HVAC")).toBeVisible();
    await expect(page.getByText("hero.png")).toBeVisible();
    await expect(page.getByText("image/png")).toBeVisible();

    await page.getByTestId("moderation-approve").click();
    await expect(page.getByTestId("moderation-empty")).toBeVisible();
  });

  test("superadmin can reject with a reason", async ({ page }) => {
    const state = createMockAppState();
    state.authMe.role = "superadmin";
    await installMockApi(page, state);
    const store = { uploads: [{ ...PENDING }], role: "superadmin" };
    await installModerationRoutes(page, store);

    await page.goto("/app/admin/moderation");
    await page.getByTestId("moderation-reject").click();
    await page.getByTestId("moderation-reject-reason").fill("attack card");
    await page.getByTestId("moderation-reject-submit").click();
    await expect(page.getByTestId("moderation-empty")).toBeVisible();
  });

  test("non-superadmin is sent away from the queue", async ({ page }) => {
    const state = createMockAppState();
    state.authMe.role = "owner";
    await installMockApi(page, state);

    await page.goto("/app/admin/moderation");
    await expect(page).toHaveURL(/\/app\/home/);
  });
});
