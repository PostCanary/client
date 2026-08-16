// src/api/billing.ts
import { api, postJson } from "@/api/http";

/* ------------------------------------------------------------------
 * Shared checkout / portal response shape
 * ------------------------------------------------------------------ */

export interface CheckoutSessionRaw {
  checkout_url?: string | null;
  url?: string | null;
}

export interface CheckoutSessionResult {
  url: string | null;
}

export type PlanCode = "INSIGHT" | "PERFORMANCE" | "PRECISION" | "ELITE";
export type BillingType = "subscription_included" | "internal" | "pay_per_send";

export interface PaymentMethodSummary {
  billing_type: BillingType;
  currency: "usd";
  unit_rate_cents: number;
  plan_code: PlanCode | null;
  required: boolean;
  has_payment_method: boolean;
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
  label: string | null;
}

/* ------------------------------------------------------------------
 * Tiered subscription checkout
 * Backend: POST /api/billing/create-checkout-session
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------
 * Per-postcard pricing (server-owned source of truth)
 * Backend: GET /api/billing/pricing  (public, cents)
 * ------------------------------------------------------------------ */

// POS-230 volume tier. `max_cards: null` = the open-ended top tier.
export interface PayPerSendTier {
  min_cards: number;
  max_cards: number | null;
  rate_cents: number;
}

export interface PricingPayload {
  // The rate quoted when the campaign size is unknown — the HIGHEST tier.
  pay_per_send_cents: number;
  // POS-230: the published price sheet. Optional so an older server (or a
  // cached payload) still parses; callers fall back to PAY_PER_SEND_TIERS.
  pay_per_send_tiers?: PayPerSendTier[];
  subscription_rates_cents: Record<PlanCode, number>;
  // Optional until the server ships it (Flow v2 $199 design fee).
  custom_design_fee_cents?: number;
}

export async function fetchPricing(): Promise<PricingPayload> {
  return api<PricingPayload>("/api/billing/pricing");
}

export interface PaywallConfig {
  // Backend sends snake_case keys; frontend modal uses camelCase.
  title?: string;
  body?: string;
  price_summary?: string;
  priceSummary?: string;
  primary_label?: string;
  primaryLabel?: string;
  secondary_label?: string;
  secondaryLabel?: string;
  bullets?: string[];
}

export interface BillingState {
  subscription_status?: string | null;
  is_subscribed?: boolean;
  can_run_matching?: boolean;
  needs_paywall?: boolean;
  last_payment_failed?: boolean;
  paywall_config?: PaywallConfig | null;
  plan_code?: PlanCode | null;
  resume_plan_code?: PlanCode | null;
  cancel_at_period_end?: boolean;
  pause_at_period_end?: boolean;
}

/**
 * Create a Stripe Checkout session (tiered subscription).
 *
 * Backend route: POST /api/billing/create-checkout-session
 */
export async function createCheckoutSession(
  planCode: PlanCode,
  source: string = "dashboard_paywall",
  runId?: string | null,
  metaEventId?: string,
): Promise<CheckoutSessionResult> {
  const body: Record<string, unknown> = {
    plan_code: planCode,
    source,
  };

  if (runId) {
    body.run_id = runId; // optional hint so we can resume on success
  }
  if (metaEventId) {
    body.meta_event_id = metaEventId;
  }

  const data = await postJson<CheckoutSessionRaw>(
    "/api/billing/create-checkout-session",
    body,
    { withCredentials: true }
  );

  const url =
    (data.checkout_url && String(data.checkout_url)) ||
    (data.url && String(data.url)) ||
    null;

  if (!url) {
    console.error("[billing.api] No checkout URL returned from backend", data);
  }

  return { url };
}

/* ------------------------------------------------------------------
 * Billing portal (manage subscription)
 * Backend: POST /api/billing/create-portal-session
 * ------------------------------------------------------------------ */

export async function createBillingPortalSession(): Promise<CheckoutSessionResult> {
  const data = await postJson<CheckoutSessionRaw>(
    "/api/billing/create-portal-session",
    {}
  );

  const url =
    (data.checkout_url && String(data.checkout_url)) ||
    (data.url && String(data.url)) ||
    null;

  if (!url) {
    console.error("[billing.api] No portal URL returned from backend", data);
  }

  return { url };
}

const BILLING_TYPES = new Set<BillingType>([
  "subscription_included",
  "internal",
  "pay_per_send",
]);
const PLAN_CODES = new Set<PlanCode>([
  "INSIGHT",
  "PERFORMANCE",
  "PRECISION",
  "ELITE",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizePaymentMethodSummary(
  value: unknown,
): PaymentMethodSummary | null {
  if (!isObject(value) || !BILLING_TYPES.has(value.billing_type as BillingType)) {
    return null;
  }
  const billingType = value.billing_type as BillingType;
  if (!("plan_code" in value)) return null;
  if (value.plan_code !== null && !PLAN_CODES.has(value.plan_code as PlanCode)) {
    return null;
  }
  const planCode = value.plan_code as PlanCode | null;
  if (
    typeof value.required !== "boolean" ||
    typeof value.has_payment_method !== "boolean" ||
    typeof value.unit_rate_cents !== "number" ||
    !Number.isSafeInteger(value.unit_rate_cents) ||
    value.unit_rate_cents < 0 ||
    value.currency !== "usd" ||
    value.required !== (billingType === "pay_per_send") ||
    (billingType === "subscription_included" && planCode === null) ||
    (billingType === "pay_per_send" && planCode !== null) ||
    (billingType === "internal" && value.unit_rate_cents !== 0)
  ) {
    return null;
  }
  return {
    billing_type: billingType,
    currency: "usd",
    unit_rate_cents: value.unit_rate_cents,
    plan_code: planCode,
    required: value.required,
    has_payment_method: value.has_payment_method,
    brand: typeof value.brand === "string" ? value.brand : null,
    last4: typeof value.last4 === "string" ? value.last4 : null,
    exp_month: Number.isSafeInteger(value.exp_month) ? value.exp_month as number : null,
    exp_year: Number.isSafeInteger(value.exp_year) ? value.exp_year as number : null,
    label: typeof value.label === "string" ? value.label : null,
  };
}

export async function fetchPaymentMethodSummary(): Promise<PaymentMethodSummary> {
  const summary = normalizePaymentMethodSummary(
    await api<unknown>("/api/billing/payment-method"),
  );
  if (!summary) throw new Error("invalid_billing_summary");
  return summary;
}

export async function createSetupSession(
  returnPath: string,
): Promise<CheckoutSessionResult> {
  const data = await postJson<CheckoutSessionRaw>(
    "/api/billing/create-setup-session",
    { return_path: returnPath },
  );

  const url =
    (data.checkout_url && String(data.checkout_url)) ||
    (data.url && String(data.url)) ||
    null;

  if (!url) {
    console.error("[billing.api] No setup URL returned from backend", data);
  }

  return { url };
}

export async function pauseSubscription(): Promise<{ billing?: BillingState | null }> {
  return postJson<{ billing?: BillingState | null }>(
    "/api/billing/pause-subscription",
    {}
  );
}

export async function changeSubscriptionPlan(
  planCode: PlanCode
): Promise<{ billing?: BillingState | null }> {
  return postJson<{ billing?: BillingState | null }>(
    "/api/billing/change-plan",
    { plan_code: planCode }
  );
}

export async function resumeSubscription(): Promise<{ billing?: BillingState | null }> {
  return postJson<{ billing?: BillingState | null }>(
    "/api/billing/resume-subscription",
    {}
  );
}

export async function cancelSubscription(): Promise<{ billing?: BillingState | null }> {
  return postJson<{ billing?: BillingState | null }>(
    "/api/billing/cancel-subscription",
    {}
  );
}

/* ------------------------------------------------------------------
 * Monthly mail usage snapshot
 * Backend: GET /api/billing/usage
 * ------------------------------------------------------------------ */

export interface UsageSnapshot {
  mail_usage: number;
  tier_limit: number | null;
  period_start: string;
  period_end: string;
  [key: string]: any;
}

export async function getUsageSnapshot(): Promise<UsageSnapshot> {
  const data = await api<UsageSnapshot>("/api/billing/usage", { method: "GET" });
  return data;
}
