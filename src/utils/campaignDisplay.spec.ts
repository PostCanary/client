import { describe, expect, it } from "vitest";

import type { MailCampaign, MailCampaignOrder } from "@/types/campaign";
import {
  campaignOrderNeedsAttention,
  campaignPiecesSent,
  campaignRecipientCount,
  campaignStatusPresentation,
} from "@/utils/campaignDisplay";

function order(overrides: Partial<MailCampaignOrder> = {}): MailCampaignOrder {
  return {
    contract_version: 1,
    mailing_count: 1,
    counts: {
      approved: 100,
      requested: 100,
      purchased: 98,
      printable: 95,
      billed: 98,
      submitted: null,
      accepted: null,
      mailed: null,
      delivered: null,
      returned: null,
      failed: null,
      refunded: 0,
    },
    amounts: {
      currency: "usd",
      unit_rate_cents: 99,
      quoted_cents: 9900,
      authorized_cents: 9900,
      charged_cents: 9702,
      refunded_cents: 0,
      net_cents: 9702,
    },
    artwork: { front_sha256: "a".repeat(64), back_sha256: "b".repeat(64) },
    payment_state: "captured",
    fulfillment_state: "not_started",
    reconciliation_state: "not_required",
    reconciliation_reason: null,
    recovery_action: "none",
    ...overrides,
  };
}

function campaign(value: MailCampaignOrder | null): MailCampaign {
  return {
    status: "in_production",
    order: value,
    orderContractPresent: value !== null,
    householdCount: 999,
    totalCost: 999,
    totalSpent: 999,
    cards: [{ status: "in_production" }],
  } as unknown as MailCampaign;
}

describe("durable campaign display boundaries", () => {
  it("never falls back to legacy pieces or recipients when an order field is unknown", () => {
    const value = order({
      counts: {
        ...order().counts,
        approved: null,
        requested: null,
        purchased: null,
        printable: null,
        submitted: null,
      },
    });

    expect(campaignPiecesSent(campaign(value))).toBeNull();
    expect(campaignRecipientCount(campaign(value))).toBeNull();
  });

  it("preserves legacy display fallback only when the order is entirely absent", () => {
    expect(campaignPiecesSent(campaign(null))).toBe(999);
    expect(campaignRecipientCount(campaign(null))).toBe(999);
  });

  it("does not fall back when a malformed order envelope was present", () => {
    const value = campaign(null);
    value.orderContractPresent = true;

    expect(campaignPiecesSent(value)).toBeNull();
    expect(campaignRecipientCount(value)).toBeNull();
    expect(campaignStatusPresentation(value).label).toBe("Status unavailable");
  });

  it.each([
    ["failed pieces", { failed: 1 }],
    ["returned pieces", { returned: 1 }],
    ["submitted beyond printable", { submitted: 96 }],
    ["purchased beyond requested", { purchased: 101 }],
  ])("flags %s as requiring attention", (_name, countOverrides) => {
    const value = order({ counts: { ...order().counts, ...countOverrides } });
    expect(campaignOrderNeedsAttention(value)).toBe(true);
  });

  it("flags partial partner acceptance even without a reconciliation marker", () => {
    const value = order({
      fulfillment_state: "partially_accepted",
      counts: { ...order().counts, submitted: 95, accepted: 90 },
    });

    expect(campaignOrderNeedsAttention(value)).toBe(true);
    expect(campaignStatusPresentation({ status: "in_production", order: value }).label)
      .toBe("Needs attention");
  });

  it("does not inherit coarse production status before durable submission", () => {
    expect(
      campaignStatusPresentation({ status: "in_production", order: order() }).label,
    ).toBe("Preparing");
  });
});
