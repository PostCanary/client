import { beforeEach, describe, expect, it, vi } from "vitest";

import { api, postJson } from "@/api/http";
import {
  createSetupSession,
  fetchPaymentMethodSummary,
  normalizePaymentMethodSummary,
} from "@/api/billing";

vi.mock("@/api/http", () => ({
  api: vi.fn(),
  postJson: vi.fn(),
}));

describe("pay-per-send billing API", () => {
  beforeEach(() => {
    vi.mocked(api).mockReset();
    vi.mocked(postJson).mockReset();
  });

  it("loads the real payment method summary", async () => {
    vi.mocked(api).mockResolvedValue({
      billing_type: "pay_per_send",
      currency: "usd",
      unit_rate_cents: 99,
      plan_code: null,
      required: true,
      has_payment_method: true,
      brand: "visa",
      last4: "1881",
      exp_month: 12,
      exp_year: 2030,
      label: "Visa ending in 1881",
    });

    const result = await fetchPaymentMethodSummary();

    expect(api).toHaveBeenCalledWith("/api/billing/payment-method");
    expect(result.label).toBe("Visa ending in 1881");
    expect(result.unit_rate_cents).toBe(99);
  });

  it.each([
    ["missing rate", { billing_type: "pay_per_send", currency: "usd", plan_code: null, required: true, has_payment_method: true }],
    ["mismatched required flag", { billing_type: "pay_per_send", currency: "usd", unit_rate_cents: 99, plan_code: null, required: false, has_payment_method: true }],
    ["covered plan without plan code", { billing_type: "subscription_included", currency: "usd", unit_rate_cents: 79, plan_code: null, required: false, has_payment_method: false }],
    ["unsupported currency", { billing_type: "pay_per_send", currency: "eur", unit_rate_cents: 99, plan_code: null, required: true, has_payment_method: true }],
    ["invalid plan code disguised as null entitlement", { billing_type: "pay_per_send", currency: "usd", unit_rate_cents: 99, plan_code: "STARTER", required: true, has_payment_method: true }],
  ])("rejects an incomplete server billing summary: %s", (_name, value) => {
    expect(normalizePaymentMethodSummary(value)).toBeNull();
  });

  it("creates card setup with a same-app return path", async () => {
    vi.mocked(postJson).mockResolvedValue({
      url: "https://checkout.stripe.com/setup/test",
    });

    const result = await createSetupSession(
      "/app/send/draft-1?audienceId=aud-1",
    );

    expect(postJson).toHaveBeenCalledWith(
      "/api/billing/create-setup-session",
      { return_path: "/app/send/draft-1?audienceId=aud-1" },
    );
    expect(result.url).toBe("https://checkout.stripe.com/setup/test");
  });
});
