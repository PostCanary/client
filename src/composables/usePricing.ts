// src/composables/usePricing.ts
// Server-owned per-postcard rates. Fetches GET /api/billing/pricing once
// per app session and exposes a reactive rates object (dollars). Until the
// fetch resolves (or if it fails), the PRICING fallback constants apply —
// they carry the same locked values, so the UI never flashes a wrong price.
import { reactive, readonly } from "vue";

import {
  fetchPricing,
  type AnalyticsPlan,
  type PayPerSendTier,
  type PlanCode,
} from "@/api/billing";
import { PAY_PER_SEND_TIERS, PRICING } from "@/types/campaign";

type Rates = { -readonly [K in keyof typeof PRICING]: number };

const rates = reactive<Rates>({ ...PRICING });

// POS-230 volume tiers, as served by the API. Seeded from the fallback so a
// price sheet always renders; replaced wholesale by the server's table.
const tiers = reactive<{ list: PayPerSendTier[] }>({
  list: PAY_PER_SEND_TIERS.map((t) => ({ ...t })),
});
export type AnalyticsPlanRow = AnalyticsPlan & { code: PlanCode };
const analyticsPlans = reactive<{ list: AnalyticsPlanRow[] }>({ list: [] });

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
      if (Array.isArray(p.pay_per_send_tiers) && p.pay_per_send_tiers.length) {
        tiers.list = p.pay_per_send_tiers.map((t) => ({ ...t }));
      }
      analyticsPlans.list = Object.entries(p.analytics_plans).map(
        ([code, plan]) => ({ code: code as PlanCode, ...plan }),
      );
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

/** The published pay-per-send price sheet, server-owned. */
export function usePayPerSendTiers(): Readonly<{ list: PayPerSendTier[] }> {
  load();
  return readonly(tiers) as Readonly<{ list: PayPerSendTier[] }>;
}

/** The server-owned analytics subscription catalog. */
export function useAnalyticsPlans(): Readonly<{ list: AnalyticsPlanRow[] }> {
  load();
  return readonly(analyticsPlans) as Readonly<{ list: AnalyticsPlanRow[] }>;
}

/**
 * Per-card rate (dollars) for a KNOWN campaign card count, resolved from the
 * POS-230 volume tiers — the first tier whose max covers the count wins, and
 * the rate applies retroactively to every card. Unknown or non-positive
 * counts quote the no-count fallback (the highest tier) so we never promise
 * a volume rate a campaign may not reach.
 */
export function payPerSendRateFor(cardCount: number | null | undefined): number {
  load();
  if (typeof cardCount !== "number" || !Number.isFinite(cardCount) || cardCount < 1) {
    return rates.payPerSend;
  }
  for (const tier of tiers.list) {
    if (tier.max_cards === null || cardCount <= tier.max_cards) {
      return tier.rate_cents / 100;
    }
  }
  return rates.payPerSend;
}

/** "1 – 1,500 postcards" / "1,501+ postcards" for a tier row. */
export function formatTierRange(tier: PayPerSendTier): string {
  const min = tier.min_cards.toLocaleString();
  if (tier.max_cards === null) return `${min}+ postcards`;
  return `${min} – ${tier.max_cards.toLocaleString()} postcards`;
}
