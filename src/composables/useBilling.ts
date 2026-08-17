// src/composables/useBilling.ts
import { ref, computed, watch } from "vue";
import type { RouteLocationNormalizedLoaded, Router } from "vue-router";

import { useAuthStore } from "@/stores/auth";
import { createSetupSession } from "@/api/billing";
import { captureEvent } from "@/composables/usePostHog";

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
  tierHint?: string;
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

  // Legacy subscription return parameters do not create a PAYG entitlement.
  const showBillingSuccess = computed(() => false);

  // Track payment failures
  watch(showPaymentFailed, (isFailed) => {
    if (isFailed) {
      captureEvent("payment_failed", {
        status: billing.value?.subscription_status,
      });
    }
  });

  function dismissBillingSuccess() {
    const { billing: _billing, ...rest } = route.query;
    router.replace({ query: rest }).catch(() => {});
  }

  function onRequireSubscription() {
    showPaywall.value = true;
  }

  function onPaywallPrimary() {
    showPaywall.value = false;
  }

  function onPaywallSecondary() {
    showPaywall.value = false;
  }

  async function onPaymentFixPrimary() {
    if (paymentFailedBusy.value) return;
    paymentFailedBusy.value = true;

    try {
      const { url } = await createSetupSession("/app/settings");

      if (!url) {
        console.error("[Billing] No card setup URL");
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
    captureEvent("retired_subscription_checkout_ignored", { source: src });
    const { startCheckout: _startCheckout, plan: _plan, ...rest } = route.query;
    await router.replace({ query: rest }).catch(() => {});
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
