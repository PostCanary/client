<!-- src/components/home/HomePricing.vue -->
<script setup lang="ts">
import { ref } from "vue";
import SectionWrapper from "@/components/marketing/SectionWrapper.vue";
import SectionHeading from "@/components/marketing/SectionHeading.vue";
import AnimatedEntry from "@/components/marketing/AnimatedEntry.vue";
import check from "@/assets/home/check-icon.svg?url";
import { createCheckoutSession, type PlanCode } from "@/api/billing";
import { PLAN_DISPLAY_DETAILS, PLAN_DISPLAY_ORDER } from "@/config/plans";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { generateEventId, trackInitiateCheckout } from "@/composables/useMetaPixel";
import PricingCalculator from "./PricingCalculator.vue";

const props = withDefaults(defineProps<{ hideCalculator?: boolean }>(), {
  hideCalculator: false,
});

const router = useRouter();
const auth = useAuthStore();

/* ── Calculator recommendation state ──────────────────────── */
const recommendations = ref<{
  ongoingPlanId: PlanCode | null;
  fastStartPlanId: PlanCode | null;
} | null>(null);

function onRecommendations(rec: {
  ongoingPlanId: PlanCode | null;
  fastStartPlanId: PlanCode | null;
}) {
  recommendations.value = rec;
}

function badgeFor(
  tierId: PlanCode,
): { label: string; variant: "teal" | "navy" } | null {
  if (!recommendations.value) return null;
  const { ongoingPlanId, fastStartPlanId } = recommendations.value;
  const isOngoing = ongoingPlanId === tierId;
  const isFastStart = fastStartPlanId === tierId;

  if (isOngoing && isFastStart) return { label: "Recommended", variant: "teal" };
  if (isOngoing && !isFastStart) return { label: "Best for ongoing", variant: "teal" };
  if (!isOngoing && isFastStart) return { label: "Best for fast start", variant: "navy" };
  return null;
}

type Feature = { icon: string; label: string };

type Tier = {
  id: PlanCode;
  name: string;
  price: string;
  perMonthLabel: string;
  includedLabel?: string;
  perMailerLabel?: string;
  features: Feature[];
};

const commonFeatures: Feature[] = [
  { icon: check, label: "Full Access to KPIs" },
  { icon: check, label: "ROI calculation" },
  { icon: check, label: "Job conversion rate" },
  { icon: check, label: "Top performing cities and zip codes" },
  { icon: check, label: "AI Insights" },
  { icon: check, label: "Demographics" },
];

const tiers: Tier[] = PLAN_DISPLAY_ORDER.map((code) => ({
  id: code,
  name: PLAN_DISPLAY_DETAILS[code].name,
  price: PLAN_DISPLAY_DETAILS[code].price.replace("/mo", ""),
  perMonthLabel: "/ Month",
  includedLabel: PLAN_DISPLAY_DETAILS[code].includedLabel,
  features: commonFeatures,
}));

const starterBusy = ref(false);
const activeTierId = ref<PlanCode | null>(null);

const onGetStartedClick = async (tierId: PlanCode) => {
  if (starterBusy.value) return;

  if (!auth.isAuthenticated) {
    auth.openLoginModal("/dashboard", "signup");
    return;
  }

  if (auth.isSubscribed) {
    router.push("/dashboard");
    return;
  }

  starterBusy.value = true;
  activeTierId.value = tierId;

  try {
    const tier = tiers.find((t) => t.id === tierId);
    const eventId = generateEventId();
    trackInitiateCheckout(
      { value: tier?.price?.replace("$", ""), currency: "USD", content_name: tier?.name ?? tierId },
      eventId,
    );

    const source = `home_pricing_${tierId.toLowerCase()}`;
    const { url } = await createCheckoutSession(tierId, source, null, eventId);
    if (url) {
      window.location.href = url;
    } else {
      console.error(
        "[HomePricing] No checkout URL received from createCheckoutSession"
      );
    }
  } catch (err) {
    console.error("[HomePricing] Failed to start checkout", err);
  } finally {
    starterBusy.value = false;
    activeTierId.value = null;
  }
};
</script>

<template>
  <SectionWrapper bg="alt" id="pricing">
    <SectionHeading
      badge="Pricing"
      heading="Plans that scale with your mail volume."
      subheading="Full access to every feature on every plan. Pick the volume that fits."
    />

    <!-- Calculator -->
    <AnimatedEntry v-if="!hideCalculator">
      <PricingCalculator @recommendations="onRecommendations" />
    </AnimatedEntry>

    <!-- Cards row -->
    <div class="mt-10 sm:mt-12">
      <div
        class="flex w-full flex-col gap-6 sm:gap-8 sm:flex-row sm:flex-wrap lg:flex-nowrap justify-center"
      >
        <AnimatedEntry
          v-for="(tier, i) in tiers"
          :key="tier.id"
          :delay="i * 100"
          class="w-full max-w-[360px]"
        >
          <article
            class="relative flex h-full flex-col rounded-[var(--mkt-card-radius)] border bg-[var(--mkt-card)] px-6 sm:px-8 pt-8 sm:pt-10 pb-8 shadow-[var(--mkt-card-shadow)] hover:shadow-[var(--mkt-card-shadow-lg)] transition-all duration-300"
            :class="[
              badgeFor(tier.id)
                ? 'ring-2 ring-[var(--mkt-teal)] border-transparent'
                : 'border-[var(--mkt-border)]',
            ]"
          >
            <!-- Recommendation badge -->
            <Transition name="badge-pop">
              <span
                v-if="badgeFor(tier.id)"
                :key="badgeFor(tier.id)!.label"
                class="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-[11px] sm:text-[12px] font-semibold"
                :class="
                  badgeFor(tier.id)!.variant === 'teal'
                    ? 'bg-[var(--mkt-teal)] text-white'
                    : 'bg-[var(--mkt-navy)] text-white'
                "
              >
                {{ badgeFor(tier.id)!.label }}
              </span>
            </Transition>

            <div>
              <h3
                class="text-[18px] sm:text-[20px] font-bold tracking-[0.02em] text-[var(--mkt-text)] uppercase"
              >
                {{ tier.name }}
              </h3>

              <div class="mt-4 h-px w-full bg-[var(--mkt-border)]" />

              <div class="mt-6 flex items-baseline gap-3">
                <span
                  class="text-[40px] leading-[46px] sm:text-[48px] sm:leading-[56px] font-semibold tracking-[-0.04em] text-[var(--mkt-text)]"
                >
                  {{ tier.price }}
                </span>
                <span
                  class="text-[16px] sm:text-[18px] font-semibold text-[var(--mkt-teal)]"
                >
                  {{ tier.perMonthLabel }}
                </span>
              </div>

              <div class="mt-4 h-px w-full bg-[var(--mkt-border)]" />

              <p
                v-if="tier.includedLabel"
                class="mt-5 rounded-lg bg-[var(--mkt-teal)]/8 px-4 py-3 text-center text-[16px] sm:text-[18px] font-semibold tracking-[-0.02em] text-[var(--mkt-teal)]"
              >
                {{ tier.includedLabel }}
              </p>
            </div>

            <ul
              class="mt-6 sm:mt-8 text-[15px] sm:text-[17px] leading-9 text-[var(--mkt-text-muted)]"
            >
              <li
                v-for="feature in tier.features"
                :key="feature.label"
                class="flex items-start gap-3"
              >
                <img
                  :src="feature.icon"
                  alt=""
                  class="mt-2.5 h-[14px] w-[14px] shrink-0"
                />
                <span>{{ feature.label }}</span>
              </li>
            </ul>

            <div class="mt-auto">
              <div class="mt-6 h-px w-full bg-[var(--mkt-border)]" />
              <p
                v-if="tier.perMailerLabel"
                class="mt-1 text-[14px] sm:text-[16px] text-[var(--mkt-text-soft)]"
              >
                {{ tier.perMailerLabel }}
              </p>

              <button
                type="button"
                @click="onGetStartedClick(tier.id)"
                :disabled="starterBusy"
                class="mt-5 sm:mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--mkt-navy)] px-6 py-3 text-[15px] sm:text-[16px] font-semibold text-white hover:bg-[var(--mkt-navy)]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <span v-if="!starterBusy || activeTierId !== tier.id">
                  Get Started
                </span>
                <span v-else>Redirecting…</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </article>
        </AnimatedEntry>
      </div>

      <!-- Bottom note -->
      <p
        class="mt-8 sm:mt-10 text-center text-[14px] sm:text-[16px] text-[var(--mkt-teal)] font-medium"
      >
        No setup fees. No contracts. Upgrade or cancel anytime.
      </p>
    </div>
  </SectionWrapper>
</template>

<style scoped>
.badge-pop-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.badge-pop-leave-active {
  transition: all 0.2s ease;
}

.badge-pop-enter-from {
  opacity: 0;
  transform: translate(-50%, 4px) scale(0.85);
}

.badge-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -4px) scale(0.85);
}
</style>
