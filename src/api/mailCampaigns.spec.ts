import { beforeEach, describe, expect, it, vi } from "vitest";

import { api, get, postJson } from "@/api/http";
import {
  createApprovalArtifact,
  getMailCampaign,
  getMailScheduleAvailability,
  normalizeOrderProjection,
  purchaseCampaignRecords,
} from "@/api/mailCampaigns";

vi.mock("@/api/http", () => ({
  api: vi.fn(),
  get: vi.fn(),
  postJson: vi.fn(),
}));

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
      order: {
        contract_version: 1,
        mailing_count: 1,
        counts: { approved: 250, requested: 250, purchased: 248 },
        amounts: { currency: "usd", unit_rate_cents: 87, quoted_cents: 21750 },
        artwork: { front_sha256: "a".repeat(64) },
        payment_state: "authorized",
        fulfillment_state: "submitted",
        reconciliation_state: "in_sync",
        reconciliation_reason: null,
        recovery_action: "none",
      },
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

  it("normalizes missing and malformed order fields to null without inventing values", () => {
    const order = normalizeOrderProjection({
      contract_version: 1,
      mailing_count: "1",
      counts: { approved: 12, requested: -1, delivered: 3.5 },
      amounts: { currency: "usd", quoted_cents: 1044, charged_cents: "1044" },
      artwork: { front_sha256: "abc", back_sha256: 7, ignored: "value" },
      recovery_action: "try_again",
    });

    expect(order).not.toBeNull();
    expect(order?.mailing_count).toBeNull();
    expect(order?.counts.approved).toBe(12);
    expect(order?.counts.requested).toBeNull();
    expect(order?.counts.delivered).toBeNull();
    expect(order?.amounts.quoted_cents).toBe(1044);
    expect(order?.amounts.charged_cents).toBeNull();
    expect(order?.artwork).toEqual({ front_sha256: "abc", back_sha256: null });
    expect(order?.recovery_action).toBeNull();
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
      order: {
        contract_version: 1,
        mailing_count: 1,
        counts: { approved: 250, submitted: 240, delivered: 200, failed: 5 },
        amounts: { currency: "usd", quoted_cents: 21750, charged_cents: 20880 },
        artwork: null,
        payment_state: "charged",
        fulfillment_state: "retry_pending",
        reconciliation_state: "required",
        reconciliation_reason: "partial_vendor_acceptance",
        recovery_action: "contact_support",
      },
    });

    const campaign = await getMailCampaign("campaign-1");

    expect(campaign.order?.counts.submitted).toBe(240);
    expect(campaign.order?.counts.delivered).toBe(200);
    expect(campaign.order?.counts.failed).toBe(5);
    expect(campaign.order?.amounts.charged_cents).toBe(20880);
  });
});
