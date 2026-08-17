import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/billing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/billing")>();
  return {
    ...actual,
    fetchPricing: vi.fn().mockResolvedValue({
      contract_version: "2026-08-17-payg",
      currency: "usd",
      billing_model: "pay_as_you_go_per_send",
      subscription_fee_cents: 0,
      subscription_covers: "nothing",
      physical_mail_charged_per_send: true,
      pay_per_send_cents: 89,
      pay_per_send_tiers: [
        { min_cards: 1, max_cards: 1500, rate_cents: 89 },
        { min_cards: 1501, max_cards: null, rate_cents: 85 },
      ],
      custom_design_fee_cents: 19900,
      tax_policy: "not_collected",
      refund_policy: "operator_recorded_only",
      credit_policy: "explicit_internal_entitlement_only",
    }),
  };
});

import CostBreakdown from "./CostBreakdown.vue";

describe("canonical cost breakdown", () => {
  it("charges an active plan for every physical postcard", () => {
    const wrapper = mount(CostBreakdown, {
      props: {
        householdCount: 100,
        sequenceLength: 1,
        billingSummary: {
          billing_type: "pay_per_send",
          currency: "usd",
          unit_rate_cents: 89,
          plan_code: "PERFORMANCE",
          required: true,
          has_payment_method: true,
          brand: "visa",
          last4: "1881",
          exp_month: 12,
          exp_year: 2030,
          label: "Visa ending in 1881",
        },
      },
    });

    expect(wrapper.get('[data-testid="server-cost-total"]').text()).toContain(
      "$89.00",
    );
    expect(wrapper.text()).toContain(
      "The subscription fee is $0",
    );
    expect(wrapper.text()).not.toContain("Covered by your");
  });

  it("shows the paid custom-design line without adding it to mailing due", () => {
    const wrapper = mount(CostBreakdown, {
      props: {
        householdCount: 10,
        sequenceLength: 1,
        includeCustomDesignFee: true,
        billingSummary: {
          billing_type: "pay_per_send",
          currency: "usd",
          unit_rate_cents: 89,
          plan_code: null,
          required: true,
          has_payment_method: true,
          brand: "visa",
          last4: "1881",
          exp_month: 12,
          exp_year: 2030,
          label: "Visa ending in 1881",
        },
      },
    });

    expect(wrapper.get('[data-testid="custom-design-fee-line"]').text()).toContain(
      "$199.00 paid when requested",
    );
    expect(wrapper.get('[data-testid="server-cost-total"]').text()).toContain(
      "$8.90",
    );
  });
});
