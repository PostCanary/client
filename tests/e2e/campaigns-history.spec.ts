// POS-151: Campaigns history — In Progress / Sent tabs, card fields,
// "Your Campaign" modal, and the list-vs-area conditional affordance
// (download for list campaigns, map view for area campaigns).
import { expect, test, type Page, type Route } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

const LIST_PREVIEW =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8AARLJgwiM3AwBv7QMCaZrQZQAAAABJRU5ErkJggg==";

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function listCampaign() {
  return {
    ok: true,
    id: "campaign-list-1",
    org_id: "org-alpha",
    created_by: "user-owner",
    name: "Send to a List — Spring VIPs",
    status: "approved",
    goal_type: "send_to_list",
    service_type: "hvac",
    sequence_length: 1,
    household_count: 240,
    total_cost: 237.6,
    total_spent: 0,
    targeting_data: null,
    design_data: {},
    schedule_data: {},
    cards_data: [
      {
        cardNumber: 1,
        status: "printing",
        scheduledDate: "2026-06-01T00:00:00Z",
        estimatedDeliveryDate: "2026-06-06T00:00:00Z",
        actualSentDate: null,
        cost: 237.6,
        previewImageUrl: LIST_PREVIEW,
      },
    ],
    approved_at: "2026-05-30T18:00:00Z",
    draft_id: null,
    created_at: "2026-05-30T18:00:00Z",
    updated_at: "2026-05-30T18:00:00Z",
  };
}

function areaCampaign() {
  return {
    ok: true,
    id: "campaign-area-1",
    org_id: "org-alpha",
    created_by: "user-owner",
    name: "Target an Area — Phoenix, AZ",
    status: "delivered",
    goal_type: "target_area",
    service_type: "hvac",
    sequence_length: 1,
    household_count: 512,
    total_cost: 506.88,
    total_spent: 506.88,
    targeting_data: {
      areas: [
        {
          type: "circle",
          coordinates: [[33.4484, -112.074]],
          radiusMiles: 3,
        },
      ],
      method: "draw",
    },
    design_data: {},
    schedule_data: {},
    cards_data: [
      {
        cardNumber: 1,
        status: "delivered",
        scheduledDate: "2026-05-01T00:00:00Z",
        estimatedDeliveryDate: "2026-05-06T00:00:00Z",
        actualSentDate: "2026-05-05T00:00:00Z",
        cost: 506.88,
        previewImageUrl: "",
      },
    ],
    approved_at: "2026-04-28T18:00:00Z",
    draft_id: null,
    created_at: "2026-04-28T00:00:00Z",
    updated_at: "2026-05-06T00:00:00Z",
  };
}

async function bootCampaignsPage(page: Page) {
  const state = createMockAppState();
  await installMockApi(page, state);

  await page.route("**/api/mail-campaigns", async (route) => {
    return json(route, { ok: true, campaigns: [listCampaign(), areaCampaign()] });
  });
  await page.route("**/api/mail-campaigns/campaign-list-1", async (route) => {
    return json(route, listCampaign());
  });
  await page.route("**/api/mail-campaigns/campaign-area-1", async (route) => {
    return json(route, areaCampaign());
  });
  await page.route("**/api/campaign-drafts", async (route) => {
    return json(route, { ok: true, drafts: [] });
  });

  await page.goto("/app/campaigns");
}

test.describe("Campaigns history (POS-151)", () => {
  test("shows In Progress / Sent tabs with card fields", async ({ page }) => {
    await bootCampaignsPage(page);

    await expect(page.getByRole("button", { name: /In Progress/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Sent/ })).toBeVisible();

    // In Progress tab (default) shows the list campaign (status=approved/printing)
    await expect(page.getByText("Send to a List — Spring VIPs")).toBeVisible();
    await expect(page.getByText("Target an Area — Phoenix, AZ")).toHaveCount(0);

    const card = page.locator("div").filter({ hasText: "Send to a List — Spring VIPs" }).first();
    await expect(card.getByText("list", { exact: true })).toBeVisible();
    await expect(card.getByText("May 30, 2026")).toBeVisible();
    await expect(card.getByText("240 sent")).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Campaign design preview" }).first(),
    ).toBeVisible();

    // Switch to Sent — the area campaign (status=delivered) lives there
    await page.getByRole("button", { name: /^Sent/ }).click();
    await expect(page.getByText("Target an Area — Phoenix, AZ")).toBeVisible();
    await expect(page.getByText("Send to a List — Spring VIPs")).toHaveCount(0);

    const areaCard = page.locator("div").filter({ hasText: "Target an Area — Phoenix, AZ" }).first();
    await expect(areaCard.getByText("area", { exact: true })).toBeVisible();
    await expect(areaCard.getByText("512 sent")).toBeVisible();
    await expect(
      page.getByTestId("campaign-list-card-preview-placeholder"),
    ).toBeVisible();
  });

  test("opens the Your Campaign modal as an overlay, not a navigation", async ({
    page,
  }) => {
    await bootCampaignsPage(page);

    await page.getByText("Send to a List — Spring VIPs").click();

    await expect(page.getByRole("dialog", { name: "Your Campaign" })).toBeVisible();
    await expect(page).toHaveURL(/\/app\/campaigns$/);

    await expect(page.getByText("Campaign Date")).toBeVisible();
    await expect(page.getByText("Audience Type")).toBeVisible();
    await expect(page.getByText("Number of Pieces Sent")).toBeVisible();
  });

  test("list campaign shows a Download affordance, area campaign shows View Map", async ({
    page,
  }) => {
    await bootCampaignsPage(page);

    // List campaign → Download Audience
    await page.getByText("Send to a List — Spring VIPs").click();
    await expect(page.getByRole("dialog", { name: "Your Campaign" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download Audience" })).toBeVisible();
    await expect(page.getByRole("button", { name: "View Map" })).toHaveCount(0);
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog", { name: "Your Campaign" })).toHaveCount(0);

    // Area campaign → View Map, reveals the map preview on click
    await page.getByRole("button", { name: /^Sent/ }).click();
    await page.getByText("Target an Area — Phoenix, AZ").click();
    await expect(page.getByRole("dialog", { name: "Your Campaign" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download Audience" })).toHaveCount(0);
    const viewMapBtn = page.getByRole("button", { name: "View Map" });
    await expect(viewMapBtn).toBeVisible();
    await viewMapBtn.click();
    await expect(
      page.getByRole("img", { name: "Targeted area map preview" }),
    ).toBeVisible();
  });

  test("deep link to /app/campaigns/:id still resolves via the full-page detail route", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);
    await page.route("**/api/mail-campaigns/campaign-list-1", async (route) => {
      return json(route, listCampaign());
    });

    await page.goto("/app/campaigns/campaign-list-1");
    await expect(
      page.getByRole("heading", { name: "Send to a List — Spring VIPs" }),
    ).toBeVisible();
  });
});
