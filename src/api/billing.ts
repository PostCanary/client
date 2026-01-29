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

/* ------------------------------------------------------------------
 * Tiered subscription checkout
 * Backend: POST /api/billing/create-checkout-session
 * ------------------------------------------------------------------ */

export type PlanCode = "INSIGHT" | "PERFORMANCE" | "PRECISION" | "ELITE";

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
}

/**
 * Create a Stripe Checkout session (tiered subscription).
 *
 * Backend route: POST /api/billing/create-checkout-session
 * We call it as "/billing/..." because Axios http.ts already has "/api" as base.
 */
export async function createCheckoutSession(
  planCode: PlanCode,
  source: string = "dashboard_paywall",
  runId?: string | null
): Promise<CheckoutSessionResult> {
  const body: Record<string, unknown> = {
    plan_code: planCode,
    source,
  };

  if (runId) {
    body.run_id = runId; // optional hint so we can resume on success
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
  const data = await api<UsageSnapshot>("/billing/usage", { method: "GET" });
  return data;
}
