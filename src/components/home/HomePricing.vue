<!-- Industry-page pricing. The canonical amounts come from the server. -->
<script setup lang="ts">
import SectionWrapper from "@/components/marketing/SectionWrapper.vue";
import SectionHeading from "@/components/marketing/SectionHeading.vue";
import AnimatedEntry from "@/components/marketing/AnimatedEntry.vue";
import { formatTierRange, usePayPerSendTiers, usePricing } from "@/composables/usePricing";
import { useAuthStore } from "@/stores/auth";
import { formatCurrency } from "@/utils/format";
import { useRouter } from "vue-router";

withDefaults(defineProps<{ hideCalculator?: boolean }>(), {
  hideCalculator: false,
});

const auth = useAuthStore();
const router = useRouter();
const pricing = usePricing();
const tiers = usePayPerSendTiers();

function onGetStarted(): void {
  if (!auth.isAuthenticated) {
    auth.openLoginModal("/app/home", "signup");
    return;
  }
  void router.push("/app/home");
}
</script>

<template>
  <SectionWrapper bg="alt" id="pricing">
    <SectionHeading
      badge="$0 Subscription Fee"
      heading="Pay only when you send."
      subheading="No paid plans, free tiers, or monthly analysis-row entitlements."
    />

    <div class="mt-10 grid gap-6 md:grid-cols-3 md:max-w-6xl md:mx-auto">
      <AnimatedEntry>
        <article class="h-full rounded-[var(--mkt-card-radius)] border border-[var(--mkt-teal)] bg-[var(--mkt-card)] p-7 shadow-[var(--mkt-card-shadow-lg)]">
          <h3 class="text-xl font-bold text-[var(--mkt-text)]">Targeted Mail</h3>
          <ul class="mt-5 space-y-3">
            <li
              v-for="tier in tiers.list"
              :key="tier.min_cards"
              class="flex justify-between gap-4 border-b border-[var(--mkt-border)] pb-3 text-sm"
            >
              <span class="text-[var(--mkt-text-muted)]">{{ formatTierRange(tier) }}</span>
              <strong class="text-[var(--mkt-text)]">
                {{ formatCurrency(tier.rate_cents / 100) }} each
              </strong>
            </li>
          </ul>
          <p class="mt-5 text-sm text-[var(--mkt-text-soft)]">
            Includes recipient data, printing, and postage.
          </p>
        </article>
      </AnimatedEntry>

      <AnimatedEntry :delay="100">
        <article class="h-full rounded-[var(--mkt-card-radius)] border border-[var(--mkt-border)] bg-[var(--mkt-card)] p-7 shadow-[var(--mkt-card-shadow)]">
          <h3 class="text-xl font-bold text-[var(--mkt-text)]">Platform &amp; Analytics</h3>
          <p class="mt-5 text-4xl font-bold text-[var(--mkt-text)]">$0</p>
          <p class="mt-1 text-sm text-[var(--mkt-text-muted)]">subscription fee</p>
          <p class="mt-5 text-sm text-[var(--mkt-text-soft)]">
            A legacy subscription status never changes your send price.
          </p>
        </article>
      </AnimatedEntry>

      <AnimatedEntry :delay="200">
        <article class="h-full rounded-[var(--mkt-card-radius)] border border-[var(--mkt-border)] bg-[var(--mkt-card)] p-7 shadow-[var(--mkt-card-shadow)]">
          <h3 class="text-xl font-bold text-[var(--mkt-text)]">Custom Design</h3>
          <p class="mt-5 text-4xl font-bold text-[var(--mkt-text)]">
            {{ formatCurrency(pricing.customDesignFee) }}
          </p>
          <p class="mt-1 text-sm text-[var(--mkt-text-muted)]">per accepted request</p>
          <p class="mt-5 text-sm text-[var(--mkt-text-soft)]">
            Paid before design work starts.
          </p>
        </article>
      </AnimatedEntry>
    </div>

    <div class="mt-10 text-center">
      <button
        type="button"
        class="rounded-full bg-[var(--mkt-yellow)] px-8 py-3 font-semibold text-[var(--mkt-bg-alt)]"
        @click="onGetStarted"
      >
        Get started
      </button>
    </div>
  </SectionWrapper>
</template>
