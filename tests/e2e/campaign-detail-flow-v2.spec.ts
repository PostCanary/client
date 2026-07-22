// POS-162: CampaignDetail must render for Flow v2 campaigns (send_to_list +
// designSource 'uploaded', empty cards_data, null targeting) and still render
// legacy template campaigns with sequence cards.
import { expect, test, type Route } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

const UPLOADED_FRONT =
  "/media/design-uploads/org-alpha/front-abc123.png";
const LEGACY_PREVIEW =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8AARLJgwiM3AwBv7QMCaZrQZQAAAABJRU5ErkJggg==";
const VALID_PREVIEW_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8AARLJgwiM3AwBv7QMCaZrQZQAAAABJRU5ErkJggg==",
  "base64",
);

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

/** Flow v2 send-to-list + uploaded design — the shape that blanked the page. */
function flowV2UploadedCampaign(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    id: "campaign-flow-v2-1",
    org_id: "org-alpha",
    created_by: "user-owner",
    name: "Spring VIP Uploaded Design",
    status: "records_purchased",
    goal_type: "send_to_list",
    service_type: "hvac",
    // Server may leave these null when draft had no targeting slice.
    sequence_length: null,
    household_count: 240,
    total_cost: null,
    total_spent: 0,
    targeting_data: null,
    design_data: {
      designSource: "uploaded",
      sequenceCards: [],
      uploadedAsset: {
        fileName: "front.png",
        mimeType: "image/png",
        fileSizeBytes: 12000,
        widthPx: 1875,
        heightPx: 1275,
        frontUrl: UPLOADED_FRONT,
        backUrl: null,
      },
    },
    schedule_data: {},
    cards_data: [],
    audience_id: "audience-flow-v2",
    approved_at: "2026-07-10T18:00:00Z",
    draft_id: null,
    created_at: "2026-07-10T18:00:00Z",
    updated_at: "2026-07-10T18:00:00Z",
    ...overrides,
  };
}

/** Legacy template campaign with sequence cards + previews. */
function legacyTemplateCampaign(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    id: "campaign-legacy-1",
    org_id: "org-alpha",
    created_by: "user-owner",
    name: "Neighbor Marketing — Phoenix",
    status: "approved",
    goal_type: "neighbor_marketing",
    service_type: "hvac",
    sequence_length: 1,
    household_count: 128,
    total_cost: 88.32,
    total_spent: 0,
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
    design_data: {
      designSource: "generated",
      sequenceCards: [{ cardNumber: 1 }],
    },
    schedule_data: {},
    cards_data: [
      {
        cardNumber: 1,
        status: "printing",
        scheduledDate: "2026-05-28T00:00:00Z",
        estimatedDeliveryDate: "2026-06-02T00:00:00Z",
        actualSentDate: null,
        cost: 88.32,
        previewImageUrl: LEGACY_PREVIEW,
      },
    ],
    audience_id: null,
    approved_at: "2026-05-25T00:00:00Z",
    draft_id: null,
    created_at: "2026-05-25T00:00:00Z",
    updated_at: "2026-05-25T00:00:00Z",
    ...overrides,
  };
}

test.describe("Campaign detail — Flow v2 + legacy (POS-162)", () => {
  test("Flow v2 uploaded campaign: name, status, design preview (not blank)", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);
    await page.route("**/media/design-uploads/org-alpha/front-abc123.png", (route) =>
      route.fulfill({ status: 200, contentType: "image/png", body: VALID_PREVIEW_PNG }),
    );

    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", async (route) => {
      return json(route, flowV2UploadedCampaign());
    });

    await page.goto("/app/campaigns/campaign-flow-v2-1");

    const detail = page.getByTestId("campaign-detail");
    await expect(detail).toBeVisible();

    await expect(page.getByTestId("campaign-detail-name")).toHaveText(
      "Spring VIP Uploaded Design",
    );
    // records_purchased → friendly "Preparing"
    await expect(detail.getByText("Preparing")).toBeVisible();
    await expect(page.getByTestId("campaign-detail-recipients")).toHaveText(
      "240",
    );

    const preview = page.getByTestId("campaign-detail-design-preview");
    await expect(preview).toBeVisible();
    await expect(preview).toHaveAttribute("src", new RegExp(UPLOADED_FRONT));
    await expect(preview).toHaveAttribute("alt", "Uploaded design preview");

    // Legacy sequence timeline must not render for empty cards_data
    await expect(page.getByText("Sequence Progress")).toHaveCount(0);
  });

  test("Flow v2 with null household_count still renders (no throw)", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);
    await page.route("**/media/design-uploads/org-alpha/front-abc123.png", (route) =>
      route.fulfill({ status: 200, contentType: "image/png", body: VALID_PREVIEW_PNG }),
    );

    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", async (route) => {
      return json(
        route,
        flowV2UploadedCampaign({
          household_count: null,
          sequence_length: null,
          total_cost: null,
          cards_data: null,
        }),
      );
    });

    await page.goto("/app/campaigns/campaign-flow-v2-1");

    await expect(page.getByTestId("campaign-detail")).toBeVisible();
    await expect(page.getByTestId("campaign-detail-name")).toHaveText(
      "Spring VIP Uploaded Design",
    );
    await expect(page.getByTestId("campaign-detail-recipients")).toHaveCount(0);
    await expect(page.getByTestId("campaign-detail-design-preview")).toBeVisible();
  });

  test("Flow v2 with a failed uploaded asset shows a deterministic placeholder", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);

    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", async (route) => {
      return json(
        route,
        flowV2UploadedCampaign({
          design_data: {
            designSource: "uploaded",
            sequenceCards: [],
            uploadedAsset: {
              fileName: "front.png",
              mimeType: "image/png",
              fileSizeBytes: 12000,
              widthPx: 1875,
              heightPx: 1275,
              frontUrl: "/media/design-uploads/org-alpha/missing.png",
              backUrl: null,
            },
          },
        }),
      );
    });
    await page.route("**/media/design-uploads/org-alpha/missing.png", (route) =>
      route.fulfill({ status: 404, body: "missing" }),
    );

    await page.goto("/app/campaigns/campaign-flow-v2-1");

    await expect(page.getByTestId("campaign-detail-design-placeholder")).toContainText(
      "Preview unavailable",
    );
    await expect(page.getByTestId("campaign-detail-design-preview")).toHaveCount(0);
  });

  test("legacy template campaign still renders name + card preview", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);

    await page.route("**/api/mail-campaigns/campaign-legacy-1", async (route) => {
      return json(route, legacyTemplateCampaign());
    });

    await page.goto("/app/campaigns/campaign-legacy-1");

    await expect(page.getByTestId("campaign-detail")).toBeVisible();
    await expect(page.getByTestId("campaign-detail-name")).toHaveText(
      "Neighbor Marketing — Phoenix",
    );
    // approved maps to Preparing under the Flow v2 label set
    await expect(page.getByTestId("campaign-detail").getByText("Preparing")).toBeVisible();

    await expect(page.getByText("Sequence Progress")).toBeVisible();
    await expect(page.getByRole("img", { name: "Card 1 preview" })).toHaveAttribute(
      "src",
      LEGACY_PREVIEW,
    );
    await expect(page.getByText("Targeting Summary")).toBeVisible();
  });
});

test.describe("Flow v2 print recovery (Codex review P2)", () => {
  test("retry button replays purchase-records and refreshes to submitted", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);

    let purchaseCalls = 0;
    let campaignStatus = "records_purchased";

    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", (route) =>
      json(route, flowV2UploadedCampaign({ status: campaignStatus })),
    );
    await page.route(
      "**/api/mail-campaigns/campaign-flow-v2-1/purchase-records",
      (route) => {
        purchaseCalls += 1;
        campaignStatus = "submitted_to_partner";
        return json(route, {
          ok: true,
          source: "audience",
          record_count: 1,
          print_submit_status: "submitted",
        });
      },
    );

    await page.goto("/app/campaigns/campaign-flow-v2-1");

    const retry = page.getByTestId("retry-print-submission");
    await expect(retry).toBeVisible();
    // The legacy ops modal must NOT be offered for uploaded designs.
    await expect(page.getByText("Submit Print Job")).toHaveCount(0);

    await retry.click();
    await expect
      .poll(() => purchaseCalls, { timeout: 5000 })
      .toBe(1);
    // Refetch after success shows the advanced status and hides the button.
    await expect(page.getByTestId("campaign-detail").getByText("In production")).toBeVisible();
    await expect(retry).toHaveCount(0);
  });

  test("retry failure surfaces an error and keeps the button", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);

    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", (route) =>
      json(route, flowV2UploadedCampaign({ status: "records_purchased" })),
    );
    await page.route(
      "**/api/mail-campaigns/campaign-flow-v2-1/purchase-records",
      (route) =>
        json(
          route,
          { error: "print_submit_failed", message: "Partner rejected artwork" },
          502,
        ),
    );

    await page.goto("/app/campaigns/campaign-flow-v2-1");
    await page.getByTestId("retry-print-submission").click();

    await expect(page.getByTestId("retry-print-error")).toBeVisible();
    await expect(page.getByTestId("retry-print-submission")).toBeVisible();
  });

  test("retry button absent once already submitted", async ({ page }) => {
    const state = createMockAppState();
    await installMockApi(page, state);
    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", (route) =>
      json(route, flowV2UploadedCampaign({ status: "submitted_to_partner" })),
    );
    await page.goto("/app/campaigns/campaign-flow-v2-1");
    await expect(page.getByTestId("campaign-detail")).toBeVisible();
    await expect(page.getByTestId("retry-print-submission")).toHaveCount(0);
  });
});
