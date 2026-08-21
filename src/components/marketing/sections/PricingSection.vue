<!-- src/components/marketing/sections/PricingSection.vue -->
<!-- POS-198 canonical pricing section. -->
<script setup lang="ts">
import { computed } from "vue";

import {
  formatTierRange,
  usePayPerSendTiers,
  usePricing,
} from "@/composables/usePricing";
import { formatCurrency, formatNumber } from "@/utils/format";

const pricing = usePricing();
const targetedTiers = usePayPerSendTiers();
const volumeTierNote = computed(() => {
  const tier = targetedTiers.list[1];
  return tier
    ? `At ${formatNumber(tier.min_cards)} postcards, every postcard in that campaign bills at ${formatCurrency(tier.rate_cents / 100)}.`
    : "One server-confirmed rate applies to every postcard in the campaign.";
});
</script>

<template>
  <section
    id="pricing"
    class="mkt-anchor-section bg-[var(--mkt-bg)]"
    aria-labelledby="pricing-heading"
    tabindex="-1"
  >
    <!-- Full-width band, per mockup -->
    <div class="pricing-band">
      <p>$0 Subscription Fee — pay only when you send.</p>
    </div>

    <div
      class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16 py-20 sm:py-28"
    >
      <h2
        id="pricing-heading"
        class="text-center text-3xl sm:text-4xl font-bold tracking-tight text-[var(--mkt-text)]"
      >
        Pricing
      </h2>

      <!-- EDDM has no card here on purpose (Dustin, 2026-08-15). EDDM is out
           of launch scope (POS-164) and has no billing path in the server at
           all (POS-231), so the mockup's flat $0.47 advertised a rate checkout
           could not charge. Do not re-add a price before POS-231 ships. -->
      <div class="mt-12 grid gap-6 md:grid-cols-3 md:max-w-6xl md:mx-auto">
        <!-- Targeted Mail -->
        <article class="pricing-card pricing-card-featured">
          <h3 class="pricing-card-title">Targeted Mail</h3>
          <ul class="pricing-tiers">
            <li v-for="tier in targetedTiers.list" :key="tier.min_cards">
              <span>{{ formatTierRange(tier) }}</span>
              <span class="pricing-tier-price">
                {{ formatCurrency(tier.rate_cents / 100) }}
              </span>
            </li>
          </ul>
          <p class="pricing-note">
            {{ volumeTierNote }} Includes recipient data, printing, and postage.
          </p>
        </article>

        <!-- Platform -->
        <article class="pricing-card">
          <h3 class="pricing-card-title">Platform &amp; Analytics</h3>
          <div class="pricing-flat">
            <span class="pricing-flat-label">Subscription fee</span>
            <span class="pricing-flat-price">$0</span>
          </div>
          <p class="pricing-note">
            No paid plans, free tiers, or monthly analysis-row entitlements.
            Physical postcards are pay as you go.
          </p>
        </article>

        <!-- Custom design -->
        <article class="pricing-card">
          <h3 class="pricing-card-title">Custom Postcard Design</h3>
          <div class="pricing-flat">
            <span class="pricing-flat-label">One accepted design request</span>
            <span class="pricing-flat-price">
              {{ formatCurrency(pricing.customDesignFee) }}
            </span>
          </div>
          <p class="pricing-note">
            A separate service line item, paid before design work starts.
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pricing-band {
  background: var(--pc-navy);
  color: var(--pc-white);
  text-align: center;
  padding: 1.1rem 1rem;
  font-weight: 700;
  font-size: clamp(1rem, 2.4vw, 1.35rem);
  letter-spacing: 0.01em;
}

.pricing-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--mkt-border);
  border-radius: var(--mkt-card-radius);
  background: var(--mkt-card);
  box-shadow: var(--mkt-card-shadow);
  padding: 2rem 1.75rem;
}

.pricing-card-featured {
  border-color: var(--pc-teal-brand);
  box-shadow:
    0 0 0 1px var(--pc-teal-brand),
    var(--mkt-card-shadow-lg);
}

.pricing-card-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--mkt-text);
}

.pricing-flat {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pricing-flat-label {
  color: var(--mkt-text-muted);
  font-size: 0.95rem;
}

.pricing-flat-price {
  font-family: var(--pc-font-display);
  font-size: 2.6rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--mkt-text);
}

.pricing-tiers {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
}

.pricing-tiers li {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--mkt-border);
  color: var(--mkt-text-muted);
  font-size: 0.95rem;
}

.pricing-tiers li:last-child {
  border-bottom: 0;
}

.pricing-tier-price {
  font-family: var(--pc-font-display);
  font-weight: 600;
  font-size: 1.25rem;
  letter-spacing: 0.02em;
  color: var(--mkt-text);
}

.pricing-note {
  margin-top: auto;
  padding-top: 1.25rem;
  color: var(--mkt-text-soft);
  font-size: 0.875rem;
}
</style>
