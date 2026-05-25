import { expect, test, type Page, type Route } from "@playwright/test";
import {
  createMockAppState,
  installMockApi,
} from "./support/mockApi";

const AUDIENCE_ID = "aud-route-bob";

function mockExistingAudienceFlow(page: Page) {
  page.route(`**/api/audiences/${AUDIENCE_ID}/suppress`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        audience_id: AUDIENCE_ID,
        uploaded_count: 4,
        suppressed: {
          dnm: 1,
          past_customer: 0,
          recently_mailed: 0,
          total_suppressed: 1,
        },
        deliverable_count: 3,
        precedence: ["dnm", "past_customer", "recently_mailed"],
      }),
    });
  });

  page.route(`**/api/audiences/${AUDIENCE_ID}/cost`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        audience_id: AUDIENCE_ID,
        deliverable_count: 3,
        per_card_cost_cents: 79,
        per_card_subtotal_cents: 237,
        enrich_enabled: false,
        melissa_enrich_estimate_cents: null,
        total_cents: 237,
      }),
    });
  });

  page.route(`**/api/audiences/${AUDIENCE_ID}/approve`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        audience_id: AUDIENCE_ID,
        status: "approved",
        campaign_id: "campaign-route",
        approved_at: new Date().toISOString(),
      }),
    });
  });
}

test.describe("SttLStep2 production route", () => {
  test("renders existing-audience Step 2 and approves from /app/send-to-a-list/:audienceId", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);
    mockExistingAudienceFlow(page);

    await page.goto(`/app/send-to-a-list/${AUDIENCE_ID}?campaignId=campaign-route`);

    await expect(page.getByRole("heading", { level: 2, name: "Send to a List" })).toBeVisible();
    await expect(page.getByTestId("suppression-strip")).toBeVisible({
      timeout: 30_000,
    });

    const approveBtn = page.getByTestId("approve-btn");
    await expect(approveBtn).toBeEnabled({ timeout: 60_000 });
    const approveRequest = page.waitForRequest(
      `**/api/audiences/${AUDIENCE_ID}/approve`,
    );
    await approveBtn.click();

    expect((await approveRequest).postDataJSON()).toEqual({
      campaign_id: "campaign-route",
    });
  });
});
