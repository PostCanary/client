import { expect, test, type Route } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

const SERVER_RENDERED_PREVIEW =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8AARLJgwiM3AwBv7QMCaZrQZQAAAABJRU5ErkJggg==";

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

test("campaign timeline uses stored render artifact thumbnails, not the Vue postcard mockup", async ({ page }) => {
  const state = createMockAppState();
  await installMockApi(page, state);

  await page.route("**/api/mail-campaigns/mail-campaign-alpha", async (route) => {
    return json(route, {
      ok: true,
      id: "mail-campaign-alpha",
      org_id: "org-alpha",
      created_by: "user-owner",
      name: "Spring Artifact Campaign",
      status: "approved",
      goal_type: "neighbor_marketing",
      service_type: "hvac",
      sequence_length: 1,
      household_count: 128,
      total_cost: 88.32,
      total_spent: 0,
      targeting_data: {},
      design_data: {},
      schedule_data: {},
      cards_data: [
        {
          cardNumber: 1,
          status: "printing",
          scheduledDate: "2026-05-28T00:00:00Z",
          estimatedDeliveryDate: "2026-06-02T00:00:00Z",
          actualSentDate: null,
          cost: 88.32,
          previewImageUrl: SERVER_RENDERED_PREVIEW,
        },
      ],
      approved_at: "2026-05-25T00:00:00Z",
      draft_id: null,
      created_at: "2026-05-25T00:00:00Z",
      updated_at: "2026-05-25T00:00:00Z",
    });
  });

  await page.goto("/app/campaigns/mail-campaign-alpha");

  await expect(page.getByRole("heading", { name: "Spring Artifact Campaign" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Card 1 preview" })).toHaveAttribute(
    "src",
    SERVER_RENDERED_PREVIEW,
  );
  await expect(page.getByTestId("campaign-card-preview-placeholder")).toHaveCount(0);
});
