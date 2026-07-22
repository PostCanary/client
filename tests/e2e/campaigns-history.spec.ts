// POS-171/POS-151: Campaigns history — Draft / Sent tabs, card fields,
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

function listCampaign(overrides: Record<string, unknown> = {}) {
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
    ...overrides,
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
    return json(route, {
      ok: true,
      drafts: [
        {
          id: "draft-1",
          org_id: "org-alpha",
          created_by: "user-owner",
          current_step: 2,
          completed_steps: [1],
          needs_review_steps: [],
          data: {
            goal: { goalLabel: "Spring HVAC Draft" },
          },
          schema_version: 1,
          created_at: "2026-05-31T00:00:00Z",
          updated_at: "2026-05-31T00:00:00Z",
        },
      ],
    });
  });

  await page.goto("/app/campaigns");
}

async function selectSentTab(page: Page) {
  await page.getByRole("button", { name: /^Sent/ }).click();
}

test.describe("Campaigns history (POS-151)", () => {
  test("shows Draft / Sent tabs and defaults to Draft", async ({ page }) => {
    await bootCampaignsPage(page);

    await expect(page.getByRole("button", { name: /^Draft/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Sent/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /In Progress/ })).toHaveCount(0);

    // Draft is sourced from campaign_drafts, not persisted mail campaigns.
    await expect(page.getByText("Spring HVAC Draft")).toBeVisible();
    await expect(page.getByText("Send to a List — Spring VIPs")).toHaveCount(0);

    await page.getByRole("button", { name: /^Sent/ }).click();
    // Sent contains all persisted post-approval campaigns, regardless of
    // their internal lifecycle status.
    await expect(page.getByText("Send to a List — Spring VIPs")).toBeVisible();
    await expect(page.getByText("Target an Area — Phoenix, AZ")).toBeVisible();

    const card = page.locator("div").filter({ hasText: "Send to a List — Spring VIPs" }).first();
    await expect(card.getByText("list", { exact: true })).toBeVisible();
    await expect(card.getByText("May 30, 2026")).toBeVisible();
    await expect(card.getByText("240", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Campaign design preview" }).first(),
    ).toBeVisible();

    const areaCard = page.locator("div").filter({ hasText: "Target an Area — Phoenix, AZ" }).first();
    await expect(areaCard.getByText("area", { exact: true })).toBeVisible();
    await expect(areaCard.getByText("512", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("campaign-list-card-preview-placeholder"),
    ).toBeVisible();
  });

  test("opens the Your Campaign modal as an overlay, not a navigation", async ({
    page,
  }) => {
    await bootCampaignsPage(page);

    await selectSentTab(page);
    await page.getByText("Send to a List — Spring VIPs").click();

    await expect(page.getByRole("dialog", { name: "Your Campaign" })).toBeVisible();
    await expect(page).toHaveURL(/\/app\/campaigns$/);

    // Scope to the modal — the grid cards also label these fields now.
    const modal = page.getByRole("dialog", { name: "Your Campaign" });
    await expect(modal.getByText("Campaign Date")).toBeVisible();
    await expect(modal.getByText("Audience Type")).toBeVisible();
    await expect(modal.getByText("Number of Pieces Sent")).toBeVisible();
  });

  test("list campaign shows a Download affordance, area campaign shows View Map", async ({
    page,
  }) => {
    await bootCampaignsPage(page);

    // List campaign → Download Audience
    await selectSentTab(page);
    await page.getByText("Send to a List — Spring VIPs").click();
    await expect(page.getByRole("dialog", { name: "Your Campaign" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download Audience" })).toBeVisible();
    await expect(page.getByRole("button", { name: "View Map" })).toHaveCount(0);
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog", { name: "Your Campaign" })).toHaveCount(0);

    // Area campaign → View Map, reveals the map preview on click
    await selectSentTab(page);
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

  test("POS-154: list campaign with an audience_id downloads the real recipient CSV", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);

    await page.route("**/api/mail-campaigns", async (route) => {
      return json(route, {
        ok: true,
        campaigns: [listCampaign({ audience_id: "audience-alpha" })],
      });
    });
    await page.route("**/api/mail-campaigns/campaign-list-1", async (route) => {
      return json(route, listCampaign({ audience_id: "audience-alpha" }));
    });
    await page.route("**/api/campaign-drafts", async (route) => {
      return json(route, { ok: true, drafts: [] });
    });

    let audienceCsvRequested = false;
    await page.route(
      "**/api/mail-campaigns/campaign-list-1/audience-csv",
      async (route) => {
        audienceCsvRequested = true;
        return route.fulfill({
          status: 200,
          contentType: "text/csv",
          body: "name,address\nJane Doe,123 Main St",
        });
      },
    );

    await page.goto("/app/campaigns");
    await selectSentTab(page);
    await page.getByText("Send to a List — Spring VIPs").click();
    await expect(page.getByRole("dialog", { name: "Your Campaign" })).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Audience" }).click();
    const download = await downloadPromise;

    expect(audienceCsvRequested).toBe(true);
    expect(download.suggestedFilename()).toBe(
      "send-to-a-list-spring-vips-recipients.csv",
    );
  });

  test("POS-154: list campaign without an audience_id falls back to the summary CSV", async ({
    page,
  }) => {
    // No audience_id in the payload — matches area campaigns and
    // pre-migration list campaigns. The audience-csv route is registered
    // but must never be hit in this case.
    let audienceCsvRequested = false;
    await bootCampaignsPage(page);
    await page.route(
      "**/api/mail-campaigns/campaign-list-1/audience-csv",
      async (route) => {
        audienceCsvRequested = true;
        return route.fulfill({ status: 404 });
      },
    );

    await selectSentTab(page);
    await page.getByText("Send to a List — Spring VIPs").click();
    await expect(page.getByRole("dialog", { name: "Your Campaign" })).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Audience" }).click();
    const download = await downloadPromise;

    expect(audienceCsvRequested).toBe(false);
    expect(download.suggestedFilename()).toBe(
      "send-to-a-list-spring-vips-audience.csv",
    );
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
