// src/composables/usePricing.ts
// Server-owned per-postcard rates. Fetches GET /api/billing/pricing once
// per app session and exposes a reactive rates object (dollars). Until the
// fetch resolves (or if it fails), the PRICING fallback constants apply —
// they carry the same locked values, so the UI never flashes a wrong price.
import { reactive, readonly } from "vue";

import { fetchPricing } from "@/api/billing";
import { PRICING } from "@/types/campaign";

type Rates = { -readonly [K in keyof typeof PRICING]: number };

const rates = reactive<Rates>({ ...PRICING });

let loaded = false;
let inflight: Promise<void> | null = null;

function load(): void {
  if (loaded || inflight) return;
  inflight = fetchPricing()
    .then((p) => {
      rates.payPerSend = p.pay_per_send_cents / 100;
      if (typeof p.custom_design_fee_cents === "number") {
        rates.customDesignFee = p.custom_design_fee_cents / 100;
      }
      rates.INSIGHT = p.subscription_rates_cents.INSIGHT / 100;
      rates.PERFORMANCE = p.subscription_rates_cents.PERFORMANCE / 100;
      rates.PRECISION = p.subscription_rates_cents.PRECISION / 100;
      rates.ELITE = p.subscription_rates_cents.ELITE / 100;
      loaded = true;
    })
    .catch(() => {
      // Keep the fallback constants; allow a retry on the next usePricing().
      inflight = null;
    });
}

export function usePricing(): Readonly<Rates> {
  load();
  return readonly(rates) as Readonly<Rates>;
}
