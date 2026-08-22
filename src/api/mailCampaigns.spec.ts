import { beforeEach, describe, expect, it, vi } from "vitest";

import { api, get, postJson } from "@/api/http";
import {
  createApprovalArtifact,
  getMailCampaign,
  getMailScheduleAvailability,
  isKnownPreProviderPurchaseError,
  normalizeOrderProjection,
  purchaseCampaignRecords,
} from "@/api/mailCampaigns";

vi.mock("@/api/http", () => ({
  api: vi.fn(),
  get: vi.fn(),
  postJson: vi.fn(),
}));

function validOrder(overrides: Record<string, unknown> = {}) {
  const counts = {
    approved: 250,
    requested: 250,
    purchased: 248,
    printable: 245,
    billed: 248,
    submitted: 245,
    accepted: null,
    mailed: null,
    delivered: null,
    returned: null,
    failed: null,
    refunded: 0,
    ...((overrides.counts as Record<string, unknown> | undefined) ?? {}),
  };
  const amounts = {
    currency: "usd",
    unit_rate_cents: 87,
    quoted_cents: 21750,
    authorized_cents: 21750,
    charged_cents: 21576,
    refunded_cents: 0,
    net_cents: 21576,
    ...((overrides.amounts as Record<string, unknown> | undefined) ?? {}),
  };
  return {
    contract_version: 1,
    mailing_count: 1,
    artwork: {
      front_sha256: "a".repeat(64),
      back_sha256: "b".repeat(64),
    },
    payment_state: "captured",
    fulfillment_state: "submitted",
    reconciliation_state: "not_required",
    reconciliation_reason: null,
    recovery_action: "none",
    ...overrides,
    counts,
    amounts,
  };
}

describe("mail campaign approval artifacts", () => {
  beforeEach(() => {
    vi.mocked(get).mockReset();
    vi.mocked(api).mockReset();
    vi.mocked(postJson).mockReset();
  });

  it("creates an approval artifact with the acknowledgement timestamp and terms version", async () => {
    vi.mocked(postJson).mockResolvedValue({
      ok: true,
      id: "artifact-1",
      org_id: "org-1",
      mail_campaign_id: "campaign-1",
      created_by: "user-1",
      source_draft_id: "draft-1",
      artifact_type: "approval_proof",
      storage_backend: "railway_volume",
      storage_key: "orgs/org-1/mail-campaigns/campaign-1/artifact-1",
      manifest: {},
      manifest_sha256: "a".repeat(64),
      terms_version: "accuracy-rights-v1",
      acknowledged_at: "2026-05-25T02:20:00.000Z",
      created_at: "2026-05-25T02:20:01.000Z",
    });

    await createApprovalArtifact("campaign-1", {
      acknowledgedAt: "2026-05-25T02:20:00.000Z",
      termsVersion: "accuracy-rights-v1",
    });

    expect(postJson).toHaveBeenCalledWith(
      "/api/mail-campaigns/campaign-1/approval-artifact",
      {
        acknowledged_at: "2026-05-25T02:20:00.000Z",
        terms_version: "accuracy-rights-v1",
      },
    );
  });

  it("gets the authenticated organization's authoritative schedule availability", async () => {
    vi.mocked(get).mockResolvedValue({
      ok: true,
      earliest_mailing_date: "2026-07-29",
      timezone: "America/Los_Angeles",
      approval_cutoff_local: "17:00:00",
      cutoff_inclusive: true,
      processing_business_days: 1,
      holiday_calendar: "us_federal_observed_nationwide",
    });

    const result = await getMailScheduleAvailability();

    expect(get).toHaveBeenCalledWith(
      "/api/mail-campaigns/schedule-availability",
    );
    expect(result.earliest_mailing_date).toBe("2026-07-29");
    expect(result.timezone).toBe("America/Los_Angeles");
  });

  it("posts no caller-owned quantity or price to the server-owned purchase contract", async () => {
    vi.mocked(api).mockResolvedValue({
      order_id: "EXISTING-ORDER-99",
      order: validOrder(),
    });

    const result = await purchaseCampaignRecords("campaign-1");

    expect(api).toHaveBeenCalledWith(
      "/api/mail-campaigns/campaign-1/purchase-records",
      { method: "POST" },
    );
    expect(result.order?.counts.approved).toBe(250);
    expect(result.order?.amounts.unit_rate_cents).toBe(87);
    expect(result.order?.counts.failed).toBeNull();
  });

  it.each([
    [
      402,
      {
        error: "payment_method_required",
        message: "Card required",
        estimated_cost_cents: 8900,
        per_postcard_rate_cents: 89,
      },
    ],
    [
      402,
      {
        error: "budget_exceeded",
        message: "Budget exceeded",
        cap_cents: 10000,
        remaining_cents: 100,
        estimated_cost_cents: 8900,
      },
    ],
    [
      402,
      {
        error: "card_declined",
        message: "Card declined",
        reason: "declined",
      },
    ],
    [
      402,
      {
        error: "authentication_required",
        message: "Bank authentication required",
        reason: "authentication_required",
      },
    ],
    [
      503,
      {
        error: "budget_unavailable",
        message: "Budget authorization is unavailable; no records were purchased.",
      },
    ],
  ])(
    "permits retry only for the explicit pre-provider contract at %s",
    (status, data) => {
      expect(isKnownPreProviderPurchaseError({ status, data })).toBe(true);
    },
  );

  it.each([
    [500, "internal_error"],
    [503, "provider_unavailable"],
    [409, "reconciliation_required"],
    [402, "budget_unavailable"],
    [undefined, undefined],
  ])(
    "fails closed for unknown or mismatched purchase outcome %s/%s",
    (status, error) => {
      expect(
        isKnownPreProviderPurchaseError({ status, data: { error } }),
      ).toBe(false);
    },
  );

  it("fails closed for a timeout without an HTTP response", () => {
    expect(
      isKnownPreProviderPurchaseError({
        code: "ECONNABORTED",
        message: "timeout",
      }),
    ).toBe(false);
  });

  it("fails closed when a nominally safe error includes an order projection", () => {
    expect(
      isKnownPreProviderPurchaseError({
        status: 503,
        data: {
          error: "budget_unavailable",
          message: "Budget authorization is unavailable",
          order: validOrder(),
        },
      }),
    ).toBe(false);
  });

  it.each([
    ["empty object", {}],
    ["version mismatch", validOrder({ contract_version: 2 })],
    ["multiple mailings", validOrder({ mailing_count: 2 })],
    ["unknown recovery action", validOrder({ recovery_action: "try_again" })],
    ["missing counts", { ...validOrder(), counts: undefined }],
    ["missing amounts", { ...validOrder(), amounts: undefined }],
    ["missing payment state", validOrder({ payment_state: null })],
    ["unknown fulfillment state", validOrder({ fulfillment_state: "maybe_sent" })],
    ["missing reconciliation state", validOrder({ reconciliation_state: null })],
    ["missing requested count", (() => {
      const value = validOrder();
      const { requested: _requested, ...counts } = value.counts;
      return { ...value, counts };
    })()],
    ["zero requested count", validOrder({ counts: { requested: 0 } })],
    ["requested count above approval", validOrder({ counts: { requested: 251 } })],
    ["missing nullable actual key", (() => {
      const value = validOrder();
      const { failed: _failed, ...counts } = value.counts;
      return { ...value, counts };
    })()],
    ["malformed nullable actual", validOrder({ counts: { failed: "1" } })],
    ["wrong order currency", validOrder({ amounts: { currency: "eur" } })],
  ])("rejects malformed durable order: %s", (_name, order) => {
    expect(normalizeOrderProjection(order)).toBeNull();
  });

  it("preserves nullable actuals after validating immutable order facts", () => {
    const order = normalizeOrderProjection(validOrder({
      counts: {
        purchased: null,
        printable: null,
        billed: null,
        submitted: null,
        accepted: null,
        mailed: null,
        delivered: null,
        returned: null,
        failed: null,
        refunded: null,
      },
      amounts: {
        authorized_cents: 0,
        charged_cents: 0,
        refunded_cents: 0,
        net_cents: 0,
      },
      payment_state: "covered",
      fulfillment_state: "not_started",
    }));

    expect(order?.counts.purchased).toBeNull();
    expect(order?.counts.submitted).toBeNull();
    expect(order?.amounts.quoted_cents).toBe(21750);
  });

  it("accepts the server authorization-ambiguous reconciliation state", () => {
    const order = normalizeOrderProjection(validOrder({
      payment_state: "authorization_ambiguous",
      fulfillment_state: "reconciliation_required",
      reconciliation_state: "required",
      reconciliation_reason: "stripe_authorization_ambiguous",
      recovery_action: "contact_support",
    }));

    expect(order?.payment_state).toBe("authorization_ambiguous");
    expect(order?.recovery_action).toBe("contact_support");
  });

  it.each([
    "authorization_cancelled",
    "authorization_release_pending",
  ])("accepts the server %s reconciliation state", (paymentState) => {
    const order = normalizeOrderProjection(validOrder({
      payment_state: paymentState,
      fulfillment_state: "reconciliation_required",
      reconciliation_state: "required",
      reconciliation_reason: "payment_release_ambiguous",
      recovery_action: "contact_support",
    }));

    expect(order?.payment_state).toBe(paymentState);
    expect(order?.recovery_action).toBe("contact_support");
  });

  it("accepts an approved audience reduced by a later DNM suppression", () => {
    const order = normalizeOrderProjection(validOrder({
      counts: {
        approved: 250,
        requested: 249,
        purchased: 249,
        printable: 249,
        billed: 249,
        submitted: 249,
      },
      amounts: {
        authorized_cents: 21663,
        charged_cents: 21663,
        net_cents: 21663,
      },
    }));

    expect(order?.counts.approved).toBe(250);
    expect(order?.counts.requested).toBe(249);
  });

  it("preserves overdelivery as durable reconciliation evidence", () => {
    const order = normalizeOrderProjection(validOrder({
      counts: { purchased: 260, printable: 250, billed: null, submitted: null },
      fulfillment_state: "reconciliation_required",
      reconciliation_state: "required",
      reconciliation_reason: "recipient_overdelivery",
      recovery_action: "contact_support",
    }));

    expect(order?.counts.approved).toBe(250);
    expect(order?.counts.purchased).toBe(260);
    expect(order?.reconciliation_state).toBe("required");
  });

  it("fails closed when the purchase response is not an object", async () => {
    vi.mocked(api).mockResolvedValue(undefined);

    const result = await purchaseCampaignRecords("campaign-1");

    expect(result.order).toBeNull();
    expect(result.record_count).toBeNull();
    expect(result.sample).toEqual([]);
  });

  it("attaches the durable order projection when serializing a campaign", async () => {
    vi.mocked(get).mockResolvedValue({
      ok: true,
      id: "campaign-1",
      org_id: "org-1",
      created_by: "user-1",
      name: "Partial fulfillment",
      status: "in_production",
      goal_type: "send_to_list",
      service_type: null,
      sequence_length: 1,
      household_count: 999,
      total_cost: 999,
      total_spent: 999,
      targeting_data: null,
      design_data: null,
      schedule_data: null,
      cards_data: [],
      approved_at: null,
      draft_id: null,
      created_at: "2026-07-31T00:00:00Z",
      updated_at: "2026-07-31T00:00:00Z",
      order: validOrder({
        counts: { submitted: 240, accepted: 220, mailed: 210, delivered: 200, failed: 5 },
        amounts: { charged_cents: 20880, net_cents: 20880 },
        fulfillment_state: "partially_accepted",
        reconciliation_state: "required",
        reconciliation_reason: "partial_vendor_acceptance",
        recovery_action: "contact_support",
      }),
    });

    const campaign = await getMailCampaign("campaign-1");

    expect(campaign.order?.counts.submitted).toBe(240);
    expect(campaign.order?.counts.delivered).toBe(200);
    expect(campaign.order?.counts.failed).toBe(5);
    expect(campaign.order?.amounts.charged_cents).toBe(20880);
  });

  it("distinguishes a malformed attempted order from a historical null order", async () => {
    vi.mocked(get).mockResolvedValue({
      ok: true,
      id: "campaign-invalid-order",
      org_id: "org-1",
      created_by: "user-1",
      name: "Invalid order",
      status: "in_production",
      goal_type: "send_to_list",
      service_type: null,
      sequence_length: 1,
      household_count: 999,
      total_cost: 999,
      total_spent: 999,
      targeting_data: null,
      design_data: null,
      schedule_data: null,
      cards_data: [],
      approved_at: null,
      draft_id: null,
      created_at: "2026-07-31T00:00:00Z",
      updated_at: "2026-07-31T00:00:00Z",
      order: {},
    });

    const campaign = await getMailCampaign("campaign-invalid-order");

    expect(campaign.order).toBeNull();
    expect(campaign.orderContractPresent).toBe(true);
  });

  it("passes through design moderation fields when a later server build exposes them", async () => {
    vi.mocked(get).mockResolvedValue({
      ok: true,
      id: "campaign-moderation",
      org_id: "org-1",
      created_by: "user-1",
      name: "Pending design",
      status: "approved",
      goal_type: "send_to_list",
      service_type: null,
      sequence_length: 1,
      household_count: 10,
      total_cost: 10,
      total_spent: 0,
      targeting_data: null,
      design_data: {
        designSource: "uploaded",
        uploadedAsset: { frontUrl: "/media/x.png" },
        moderationStatus: "pending",
      },
      schedule_data: null,
      cards_data: [],
      approved_at: null,
      draft_id: null,
      created_at: "2026-08-22T00:00:00Z",
      updated_at: "2026-08-22T00:00:00Z",
    });

    const campaign = await getMailCampaign("campaign-moderation");

    expect(campaign.moderationStatus).toBe("pending");
    expect(campaign.designSource).toBe("uploaded");
  });

  it("reads the real server shape: snake_case moderation_status/rejection_reason resolved onto the campaign by MailCampaign._serialize", async () => {
    vi.mocked(get).mockResolvedValue({
      ok: true,
      id: "campaign-moderation-real-shape",
      org_id: "org-1",
      created_by: "user-1",
      name: "Rejected design",
      status: "pending_approval",
      goal_type: "send_to_list",
      service_type: null,
      sequence_length: 1,
      household_count: 10,
      total_cost: 10,
      total_spent: 0,
      targeting_data: null,
      design_data: {
        designSource: "uploaded",
        // POST /api/design-uploads response, snake_case per server contract.
        uploadedAsset: {
          frontUrl: "/media/design-uploads/x.png",
          moderation_status: "rejected",
          rejection_reason: "Includes a competitor logo",
        },
      },
      // Campaign-level fields resolved by MailCampaign._serialize from
      // design_upload_id.
      moderation_status: "rejected",
      rejection_reason: "Includes a competitor logo",
      schedule_data: null,
      cards_data: [],
      approved_at: null,
      draft_id: null,
      created_at: "2026-08-22T00:00:00Z",
      updated_at: "2026-08-22T00:00:00Z",
    });

    const campaign = await getMailCampaign("campaign-moderation-real-shape");

    expect(campaign.moderationStatus).toBe("rejected");
    expect(campaign.rejectionReason).toBe("Includes a competitor logo");
    expect(campaign.uploadedAsset?.moderationStatus).toBe("rejected");
    expect(campaign.uploadedAsset?.rejectionReason).toBe(
      "Includes a competitor logo",
    );
  });

  it("prefers the live campaign-level moderation status over the stale design_data snapshot frozen at upload time", async () => {
    vi.mocked(get).mockResolvedValue({
      ok: true,
      id: "campaign-moderation-precedence",
      org_id: "org-1",
      created_by: "user-1",
      name: "Approved after review",
      status: "approved",
      goal_type: "send_to_list",
      service_type: null,
      sequence_length: 1,
      household_count: 10,
      total_cost: 10,
      total_spent: 0,
      targeting_data: null,
      design_data: {
        designSource: "uploaded",
        // Frozen at upload time — an admin later approved the design, but
        // this snapshot inside design_data never gets rewritten.
        uploadedAsset: {
          frontUrl: "/media/design-uploads/y.png",
          moderation_status: "pending",
        },
      },
      // Live value, resolved server-side from design_upload_id — must win
      // over the stale snapshot above.
      moderation_status: "approved",
      rejection_reason: null,
      schedule_data: null,
      cards_data: [],
      approved_at: "2026-08-22T00:00:00Z",
      draft_id: null,
      created_at: "2026-08-22T00:00:00Z",
      updated_at: "2026-08-22T00:00:00Z",
    });

    const campaign = await getMailCampaign("campaign-moderation-precedence");

    expect(campaign.moderationStatus).toBe("approved");
    expect(campaign.rejectionReason).toBeNull();
  });
});
