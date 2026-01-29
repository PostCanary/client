// src/composables/useBilling.ts
import { ref, computed, watch } from "vue";
import type { RouteLocationNormalizedLoaded, Router } from "vue-router";

import { useAuthStore } from "@/stores/auth";
import type { PlanCode } from "@/api/billing";
import { createCheckoutSession, createBillingPortalSession } from "@/api/billing";

interface BackendPaywallConfig {
  title?: string;
  body?: string;

  // snake + camel from backend
  priceSummary?: string;
  price_summary?: string;

  primaryLabel?: string;
  primary_label?: string;

  secondaryLabel?: string;
  secondary_label?: string;

  bullets?: string[];

  // tier UX (optional from backend)
  tier_picker?: boolean;
  default_plan_code?: PlanCode;
  tier_hint?: string;
}

export interface PaywallConfig {
  title?: string;
  body?: string;
  priceSummary?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  bullets?: string[];

  tierPicker?: boolean;
  defaultPlanCode?: PlanCode;
  tierHint?: string;
}

function asPlanCode(v: unknown): PlanCode | null {
  const s = String(v || "").trim().toUpperCase();
  if (s === "INSIGHT" || s === "PERFORMANCE" || s === "PRECISION" || s === "ELITE") {
    return s as PlanCode;
  }
  return null;
}

export function useBilling(route: RouteLocationNormalizedLoaded, router: Router) {
  const auth = useAuthStore();

  const showPaywall = ref(false);
  const paywallBusy = ref(false);

  const showPaymentFailed = ref(false);
  const paymentFailedBusy = ref(false);

  // Raw billing from auth store
  const rawBilling = computed<any | null>(() => auth.billing ?? null);

  // Normalize paywall_config keys into camelCase for the modal
  const billing = computed(() => {
    const b = rawBilling.value;
    if (!b) return null;

    const cfg = (b.paywall_config || {}) as BackendPaywallConfig;

    const normalizedConfig: PaywallConfig = {
      title: cfg.title,
      body: cfg.body,
      priceSummary: cfg.priceSummary ?? cfg.price_summary,
      primaryLabel: cfg.primaryLabel ?? cfg.primary_label,
      secondaryLabel: cfg.secondaryLabel ?? cfg.secondary_label,
      bullets: cfg.bullets ?? [],

      tierPicker: !!cfg.tier_picker,
      defaultPlanCode: cfg.default_plan_code,
      tierHint: cfg.tier_hint,
    };

    return { ...b, paywall_config: normalizedConfig } as any;
  });

  const paywallConfig = computed<PaywallConfig>(() => {
    return (billing.value?.paywall_config || {}) as PaywallConfig;
  });

  const isBillingOverlayActive = computed(
    () => showPaywall.value || showPaymentFailed.value
  );

  // Watch for “payment failed” statuses from backend billing
  watch(
    () => billing.value,
    (b) => {
      if (!b) return;
      const status = String(b.subscription_status || (b as any).status || "").toLowerCase();
      if (["past_due", "unpaid", "incomplete"].includes(status)) {
        showPaymentFailed.value = true;
      }
    },
    { immediate: true }
  );

  // Success banner after returning from Stripe
  const billingQuery = computed(() => route.query.billing as string | undefined);
  const billingDismissed = ref(false);

  const showBillingSuccess = computed(
    () =>
      !billingDismissed.value &&
      billingQuery.value === "success" &&
      !!billing.value?.is_subscribed
  );

  function dismissBillingSuccess() {
    billingDismissed.value = true;
    const { billing: _billing, ...rest } = route.query;
    router.replace({ query: rest }).catch(() => {});
  }

  /**
   * Still used for query-driven checkout (startCheckout).
   * Priority:
   *   1) ?plan=...
   *   2) backend config defaultPlanCode
   *   3) fallback INSIGHT
   */
  const defaultPlanCode = computed<PlanCode>(() => {
    const q = asPlanCode(route.query.plan);
    if (q) return q;

    const fromCfg = asPlanCode(paywallConfig.value?.defaultPlanCode);
    if (fromCfg) return fromCfg;

    return "INSIGHT";
  });

  function onRequireSubscription() {
    showPaywall.value = true;
  }

  /**
   * PaywallModal must emit: emit("primary", { planCode })
   */
  async function onPaywallPrimary(payload?: { planCode?: PlanCode }) {
    if (paywallBusy.value) return;
    paywallBusy.value = true;

    try {
      const planCode = payload?.planCode ?? defaultPlanCode.value;
      const { url } = await createCheckoutSession(planCode, "dashboard_paywall");
      if (url) window.location.href = url;
      else console.error("[DashboardBilling] No checkout URL received");
    } finally {
      paywallBusy.value = false;
    }
  }

  function onPaywallSecondary() {
    showPaywall.value = false;
  }

  async function onPaymentFixPrimary() {
    if (paymentFailedBusy.value) return;
    paymentFailedBusy.value = true;

    try {
      const { url } = await createBillingPortalSession();

      if (!url) {
        console.error("[Billing] No portal URL from createBillingPortalSession");
        return;
      }

      window.location.href = url;
    } catch (err) {
      console.error("[Billing] Failed to open billing portal:", err);
    } finally {
      paymentFailedBusy.value = false;
    }
  }

  function onPaymentFailedSecondary() {
    showPaymentFailed.value = false;
  }

  async function maybeStartCheckoutFromQuery() {
    const src = (route.query.startCheckout as string) || "";
    if (!src) return;

    if (!auth.initialized && !auth.loading) {
      await auth.fetchMe();
    }
    if (!auth.isAuthenticated) return;

    const planFromQuery = asPlanCode(route.query.plan);
    const planCode: PlanCode = planFromQuery ?? defaultPlanCode.value;

    try {
      const { url } = await createCheckoutSession(planCode, src);
      if (!url) {
        console.error("[Billing] No checkout URL from createCheckoutSession (startCheckout=%s)", src);
        return;
      }
      window.location.href = url;
    } catch (err) {
      console.error("[Billing] Failed to start checkout from query:", err);
    }
  }

  return {
    // state
    showPaywall,
    paywallBusy,
    showPaymentFailed,
    paymentFailedBusy,
    paywallConfig,
    isBillingOverlayActive,
    showBillingSuccess,

    // actions
    dismissBillingSuccess,
    onRequireSubscription,
    onPaywallPrimary,
    onPaywallSecondary,
    onPaymentFixPrimary,
    onPaymentFailedSecondary,
    maybeStartCheckoutFromQuery,
  };
}
