// POS-162: CampaignDetail must render for Flow v2 campaigns (send_to_list +
// designSource 'uploaded', empty cards_data, null targeting) and still render
// legacy template campaigns with sequence cards.
import { expect, test, type Route } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

const UPLOADED_FRONT =
  "/media/design-uploads/org-alpha/front-abc123.png";
const LEGACY_PREVIEW =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8AARLJgwiM3AwBv7QMCaZrQZQAAAABJRU5ErkJggg==";

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function durableOrder(overrides: Record<string, unknown> = {}) {
  const counts = {
    approved: 240,
    requested: 240,
    purchased: 238,
    printable: 236,
    billed: 238,
    submitted: null,
    accepted: null,
    mailed: null,
    delivered: null,
    returned: null,
    failed: null,
    refunded: null,
    ...((overrides.counts as Record<string, unknown> | undefined) ?? {}),
  };
  const amounts = {
    currency: "usd",
    unit_rate_cents: 87,
    quoted_cents: 20880,
    authorized_cents: 20706,
    charged_cents: 20706,
    refunded_cents: 0,
    net_cents: 20706,
    ...((overrides.amounts as Record<string, unknown> | undefined) ?? {}),
  };
  return {
    contract_version: 1,
    mailing_count: 1,
    artwork: { front_sha256: "a".repeat(64), back_sha256: "b".repeat(64) },
    payment_state: "captured",
    fulfillment_state: "not_started",
    reconciliation_state: "not_required",
    reconciliation_reason: null,
    recovery_action: "none",
    ...overrides,
    counts,
    amounts,
  };
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

  test("malformed durable order never falls back to coarse production, recipients, or cost", async ({ page }) => {
    const state = createMockAppState();
    await installMockApi(page, state);
    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", (route) =>
      json(route, flowV2UploadedCampaign({
        status: "in_production",
        household_count: 999,
        total_cost: 999,
        order: {},
      })),
    );

    await page.goto("/app/campaigns/campaign-flow-v2-1");

    await expect(page.getByText("Status unavailable")).toBeVisible();
    await expect(page.getByTestId("campaign-detail-recipients")).toHaveCount(0);
    await expect(page.getByText("Households mailed")).toHaveCount(0);
    await expect(page.getByText("Total cost:").locator("..")).toContainText("—");
    await expect(page.getByText("In production")).toHaveCount(0);
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

  test("durable order counts and server amounts override coarse campaign values without overstating failure", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);
    const order = durableOrder({
      payment_state: "authorization_ambiguous",
      fulfillment_state: "partially_accepted",
      reconciliation_state: "required",
      reconciliation_reason: "stripe_authorization_ambiguous",
      recovery_action: "contact_support",
      counts: {
        submitted: 220,
        accepted: 215,
        delivered: 180,
        failed: 7,
      },
      amounts: {
        unit_rate_cents: 83,
        quoted_cents: 19920,
        authorized_cents: 19920,
        charged_cents: 19754,
        net_cents: 19754,
      },
    });
    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", (route) =>
      json(
        route,
        flowV2UploadedCampaign({
          status: "in_production",
          household_count: 999,
          total_cost: 999,
          order,
        }),
      ),
    );

    await page.goto("/app/campaigns/campaign-flow-v2-1");

    const detail = page.getByTestId("campaign-detail");
    await expect(detail.getByText("Needs attention")).toBeVisible();
    await expect(detail.getByText("In production")).toHaveCount(0);
    await expect(page.getByTestId("campaign-recovery-support")).toContainText(
      "Contact support and do not retry",
    );
    await expect(page.getByTestId("campaign-detail-recipients")).toHaveText("220");
    await expect(page.getByTestId("order-count-submitted")).toHaveText("220");
    await expect(page.getByTestId("order-count-delivered")).toHaveText("180");
    await expect(page.getByTestId("order-count-failed")).toHaveText("7");
    await expect(page.getByTestId("order-quoted-amount")).toHaveText("$199.20");
    await expect(page.getByTestId("order-charged-amount")).toHaveText("$197.54");
  });
});

test.describe("operator fulfillment recovery contract", () => {
  test("uploaded design replays purchase-records and never calls raw print submit", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);

    let purchaseCalls = 0;
    let rawPrintSubmitCalls = 0;
    let purchaseBody: string | null = null;
    let campaignStatus = "records_purchased";
    let campaignOrder = durableOrder({
      fulfillment_state: "pre_vendor_failed",
      reconciliation_state: "not_required",
      recovery_action: "retry_purchase",
    });

    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", (route) =>
      json(route, flowV2UploadedCampaign({ status: campaignStatus, order: campaignOrder })),
    );
    await page.route(
      "**/api/mail-campaigns/campaign-flow-v2-1/purchase-records",
      (route) => {
        purchaseCalls += 1;
        purchaseBody = route.request().postData();
        campaignStatus = "submitted_to_partner";
        campaignOrder = durableOrder({
          fulfillment_state: "submitted",
          counts: { submitted: 236 },
        });
        return json(route, {
          order_id: "EXISTING-ORDER-99",
          order: campaignOrder,
        });
      },
    );
    await page.route("**/api/print_jobs/submit", (route) => {
      rawPrintSubmitCalls += 1;
      return json(route, { error: "raw_submit_must_not_be_called" }, 500);
    });

    await page.goto("/app/campaigns/campaign-flow-v2-1");

    const retry = page.getByTestId("retry-print-submission");
    await expect(retry).toBeVisible();
    await expect(retry).toHaveText("Retry fulfillment");
    await expect(page.getByText("Submit Print Job")).toHaveCount(0);

    await retry.click();
    await expect
      .poll(() => purchaseCalls, { timeout: 5000 })
      .toBe(1);
    expect(purchaseBody).toBeNull();
    expect(rawPrintSubmitCalls).toBe(0);
    // Refetch after success shows the advanced status and hides the button.
    await expect(page.getByTestId("campaign-detail").getByText("In production")).toBeVisible();
    await expect(retry).toHaveCount(0);
  });

  test("authoritative POST success removes retry when the follow-up GET fails", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);
    let detailCalls = 0;
    let purchaseCalls = 0;
    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", (route) => {
      detailCalls += 1;
      if (detailCalls > 1) {
        return json(route, { error: "refresh_failed" }, 500);
      }
      return json(route, flowV2UploadedCampaign({
        order: durableOrder({
          fulfillment_state: "pre_vendor_failed",
          recovery_action: "retry_purchase",
        }),
      }));
    });
    await page.route(
      "**/api/mail-campaigns/campaign-flow-v2-1/purchase-records",
      (route) => {
        purchaseCalls += 1;
        return json(route, {
          order_id: "EXISTING-ORDER-99",
          order: durableOrder({
            fulfillment_state: "submitted",
            counts: { submitted: 236 },
          }),
        });
      },
    );

    await page.goto("/app/campaigns/campaign-flow-v2-1");
    await page.getByTestId("retry-print-submission").click();

    await expect.poll(() => purchaseCalls).toBe(1);
    await expect.poll(() => detailCalls).toBe(2);
    await expect(page.getByTestId("campaign-detail")).toBeVisible();
    await expect(page.getByTestId("retry-print-submission")).toHaveCount(0);
    await expect(page.getByText("In production")).toBeVisible();
    await expect(page.getByTestId("retry-print-error")).toContainText(
      /latest campaign details could not be refreshed/i,
    );
    await expect.poll(() => purchaseCalls).toBe(1);
  });

  test("server pre-vendor failure response surfaces an error and keeps recovery available", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);

    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", (route) =>
      json(route, flowV2UploadedCampaign({
        status: "in_production",
        order: durableOrder({
          fulfillment_state: "pre_vendor_failed",
          reconciliation_state: "not_required",
          recovery_action: "retry_purchase",
        }),
      })),
    );
    await page.route(
      "**/api/mail-campaigns/campaign-flow-v2-1/purchase-records",
      (route) =>
        json(route, {
          order_id: "EXISTING-ORDER-99",
          order: durableOrder({
            fulfillment_state: "pre_vendor_failed",
            reconciliation_state: "not_required",
            recovery_action: "retry_purchase",
          }),
        }),
    );

    await page.goto("/app/campaigns/campaign-flow-v2-1");
    await expect(page.getByText("In production")).toHaveCount(0);
    await expect(page.getByText("Retry available")).toBeVisible();
    await page.getByTestId("retry-print-submission").click();

    await expect(page.getByTestId("retry-print-error")).toBeVisible();
    await expect(page.getByTestId("retry-print-error")).toContainText(
      "still safe to retry",
    );
    await expect(page.getByTestId("retry-print-submission")).toBeVisible();
  });

  test("409 reconciliation replaces stale retry state with durable support-only state", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);
    const staleOrder = durableOrder({
      fulfillment_state: "pre_vendor_failed",
      recovery_action: "retry_purchase",
    });
    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", (route) =>
      json(route, flowV2UploadedCampaign({ order: staleOrder })),
    );
    await page.route(
      "**/api/mail-campaigns/campaign-flow-v2-1/purchase-records",
      (route) =>
        json(route, {
          error: "reconciliation_required",
          order: durableOrder({
            fulfillment_state: "reconciliation_required",
            reconciliation_state: "required",
            reconciliation_reason: "print_operation_ambiguous",
            recovery_action: "contact_support",
          }),
        }, 409),
    );

    await page.goto("/app/campaigns/campaign-flow-v2-1");
    await page.getByTestId("retry-print-submission").click();

    await expect(page.getByTestId("retry-print-submission")).toHaveCount(0);
    await expect(page.getByTestId("campaign-recovery-support")).toContainText(
      /do not retry/i,
    );
    await expect(page.getByTestId("retry-print-error")).toContainText(
      /do not retry/i,
    );
    await expect(page.getByText("Needs attention")).toBeVisible();
  });

  test("malformed 409 blocks retry and removes stale retry status", async ({ page }) => {
    const state = createMockAppState();
    await installMockApi(page, state);
    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", (route) =>
      json(route, flowV2UploadedCampaign({
        order: durableOrder({
          fulfillment_state: "pre_vendor_failed",
          recovery_action: "retry_purchase",
        }),
      })),
    );
    await page.route(
      "**/api/mail-campaigns/campaign-flow-v2-1/purchase-records",
      (route) => json(route, { error: "reconciliation_required", order: {} }, 409),
    );

    await page.goto("/app/campaigns/campaign-flow-v2-1");
    await page.getByTestId("retry-print-submission").click();

    await expect(page.getByTestId("retry-print-submission")).toHaveCount(0);
    await expect(page.getByTestId("campaign-recovery-support")).toContainText(
      /do not retry/i,
    );
    await expect(page.getByText("Retry available")).toHaveCount(0);
    await expect(page.getByText("Status unavailable")).toBeVisible();
  });

  test("409 with an incoherent retry order still removes stale retry status", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);
    const retryOrder = durableOrder({
      fulfillment_state: "pre_vendor_failed",
      recovery_action: "retry_purchase",
    });
    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", (route) =>
      json(route, flowV2UploadedCampaign({ order: retryOrder })),
    );
    await page.route(
      "**/api/mail-campaigns/campaign-flow-v2-1/purchase-records",
      (route) =>
        json(route, {
          error: "reconciliation_required",
          order: retryOrder,
        }, 409),
    );

    await page.goto("/app/campaigns/campaign-flow-v2-1");
    await page.getByTestId("retry-print-submission").click();

    await expect(page.getByTestId("retry-print-submission")).toHaveCount(0);
    await expect(page.getByTestId("campaign-recovery-support")).toContainText(
      /do not retry/i,
    );
    await expect(page.getByText("Retry available")).toHaveCount(0);
    await expect(page.getByText("Status unavailable")).toBeVisible();
  });

  test("unknown retry 5xx blocks retry and removes stale retry status", async ({ page }) => {
    const state = createMockAppState();
    await installMockApi(page, state);
    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", (route) =>
      json(route, flowV2UploadedCampaign({
        order: durableOrder({
          fulfillment_state: "pre_vendor_failed",
          recovery_action: "retry_purchase",
        }),
      })),
    );
    await page.route(
      "**/api/mail-campaigns/campaign-flow-v2-1/purchase-records",
      (route) => json(route, { error: "internal_error" }, 500),
    );

    await page.goto("/app/campaigns/campaign-flow-v2-1");
    await page.getByTestId("retry-print-submission").click();

    await expect(page.getByTestId("retry-print-submission")).toHaveCount(0);
    await expect(page.getByTestId("campaign-recovery-support")).toContainText(
      /do not retry/i,
    );
    await expect(page.getByTestId("retry-print-error")).toContainText(
      /could not be safely confirmed/i,
    );
    await expect(page.getByText("Retry available")).toHaveCount(0);
    await expect(page.getByText("Status unavailable")).toBeVisible();
  });

  test("legacy card campaign uses the same server-owned recovery contract", async ({
    page,
  }) => {
    const state = createMockAppState();
    await installMockApi(page, state);

    let purchaseCalls = 0;
    let campaignStatus = "records_purchased";
    let campaignOrder = durableOrder({
      fulfillment_state: "pre_vendor_failed",
      recovery_action: "retry_purchase",
    });
    await page.route("**/api/mail-campaigns/campaign-legacy-1", (route) =>
      json(route, legacyTemplateCampaign({ status: campaignStatus, order: campaignOrder })),
    );
    await page.route(
      "**/api/mail-campaigns/campaign-legacy-1/purchase-records",
      (route) => {
        purchaseCalls += 1;
        expect(route.request().postData()).toBeNull();
        campaignStatus = "submitted_to_partner";
        campaignOrder = durableOrder({
          fulfillment_state: "submitted",
          counts: { submitted: 236 },
        });
        return json(route, {
          order_id: "EXISTING-ORDER-99",
          order: campaignOrder,
        });
      },
    );

    await page.goto("/app/campaigns/campaign-legacy-1");
    await expect(page.getByText("Submit Print Job")).toHaveCount(0);
    await page.getByTestId("retry-print-submission").click();
    await expect.poll(() => purchaseCalls).toBe(1);
    await expect(page.getByTestId("retry-print-submission")).toHaveCount(0);
  });

  test("member role cannot see the operator recovery action", async ({ page }) => {
    const state = createMockAppState();
    state.authMe.org_role = "member";
    await installMockApi(page, state);
    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", (route) =>
      json(route, flowV2UploadedCampaign({
        status: "records_purchased",
        order: durableOrder({
          fulfillment_state: "pre_vendor_failed",
          recovery_action: "retry_purchase",
        }),
      })),
    );

    await page.goto("/app/campaigns/campaign-flow-v2-1");
    await expect(page.getByTestId("campaign-detail")).toBeVisible();
    await expect(page.getByTestId("retry-print-submission")).toHaveCount(0);
  });

  test("retry button absent once already submitted", async ({ page }) => {
    const state = createMockAppState();
    await installMockApi(page, state);
    await page.route("**/api/mail-campaigns/campaign-flow-v2-1", (route) =>
      json(route, flowV2UploadedCampaign({
        status: "submitted_to_partner",
        order: durableOrder({ fulfillment_state: "submitted" }),
      })),
    );
    await page.goto("/app/campaigns/campaign-flow-v2-1");
    await expect(page.getByTestId("campaign-detail")).toBeVisible();
    await expect(page.getByTestId("retry-print-submission")).toHaveCount(0);
  });
});
