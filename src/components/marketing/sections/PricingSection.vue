<!-- src/components/marketing/sections/PricingSection.vue -->
<!-- POS-227 pricing section. -->
<script setup lang="ts">
// Targeted Mail price sheet decided by Dustin 2026-08-15 (POS-227). The tier
// is picked from the whole campaign and applied to every postcard in it, so
// 1,500 postcards bill at $0.85 each — not just the ones past the break.
// Server side is POS-230 (app/services/pricing.py).
// ⚠️ LAUNCH GATE (POS-229): POS-230 must be in production before this page
// goes live, or the site publishes a rate checkout will not honor. The EDDM
// card below is still gated on the POS-224 scope call.
const TARGETED_TIERS = [
  { range: "1 – 1,499 postcards", price: "$0.89" },
  { range: "1,500+ postcards", price: "$0.85" },
] as const;
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
      <p>$0 Subscription Fee. Pay Per Postcard.</p>
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

      <div class="mt-12 grid gap-6 md:grid-cols-3">
        <!-- EDDM -->
        <article class="pricing-card">
          <h3 class="pricing-card-title">EDDM</h3>
          <div class="pricing-flat">
            <span class="pricing-flat-label">Flat rate</span>
            <span class="pricing-flat-price">$0.47</span>
          </div>
          <p class="pricing-note">Every mailbox on your chosen routes.</p>
        </article>

        <!-- Targeted Mail -->
        <article class="pricing-card pricing-card-featured">
          <h3 class="pricing-card-title">Targeted Mail</h3>
          <ul class="pricing-tiers">
            <li v-for="tier in TARGETED_TIERS" :key="tier.range">
              <span>{{ tier.range }}</span>
              <span class="pricing-tier-price">{{ tier.price }}</span>
            </li>
          </ul>
          <p class="pricing-note">
            One rate per campaign. Reach 1,500 postcards and every postcard in
            that campaign bills at $0.85.
          </p>
        </article>

        <!-- Analytics -->
        <article class="pricing-card">
          <h3 class="pricing-card-title">Analytics</h3>
          <div class="pricing-flat">
            <span class="pricing-flat-label">Audit your mail send</span>
            <span class="pricing-flat-price">Free</span>
          </div>
          <p class="pricing-note">Every campaign, conversion, and KPI.</p>
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
  font-size: 2.6rem;
  font-weight: 700;
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
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--mkt-text);
}

.pricing-note {
  margin-top: auto;
  padding-top: 1.25rem;
  color: var(--mkt-text-soft);
  font-size: 0.875rem;
}
</style>
