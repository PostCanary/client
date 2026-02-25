<!-- src/components/home/HomePricing.vue -->
<script setup lang="ts">
import { ref } from "vue";
import check from "@/assets/home/check-icon.svg?url";
import rightDown from "@/assets/home/right-down.svg?url";
import { createCheckoutSession, type PlanCode } from "@/api/billing";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import PricingCalculator from "./PricingCalculator.vue";

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
): { label: string; color: "cyan" | "yellow" } | null {
  if (!recommendations.value) return null;
  const { ongoingPlanId, fastStartPlanId } = recommendations.value;
  const isOngoing = ongoingPlanId === tierId;
  const isFastStart = fastStartPlanId === tierId;

  if (isOngoing && isFastStart) return { label: "Recommended", color: "cyan" };
  if (isOngoing && !isFastStart) return { label: "Best for ongoing", color: "cyan" };
  if (!isOngoing && isFastStart) return { label: "Best for fast start", color: "yellow" };
  return null;
}

type Feature = { icon: string; label: string };

type Tier = {
  id: PlanCode; // <-- was string
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
];


// Public tiers – keep these in sync with Pricing.xlsx/backend limits
const tiers: Tier[] = [
  {
    id: "INSIGHT",
    name: "Tier 1",
    price: "$99",
    perMonthLabel: "/ Month",
    includedLabel: "Up to 1,000 mailers / month",
    features: commonFeatures,
  },
  {
    id: "PERFORMANCE",
    name: "Tier 2",
    price: "$249",
    perMonthLabel: "/ Month",
    includedLabel: "Up to 5,000 mailers / month",
    features: commonFeatures,
  },
  {
    id: "PRECISION",
    name: "Tier 3",
    price: "$499",
    perMonthLabel: "/ Month",
    includedLabel: "Up to 25,000 mailers / month",
    features: commonFeatures,
  },
  {
    id: "ELITE",
    name: "Tier 4",
    price: "$999",
    perMonthLabel: "/ Month",
    includedLabel: "Unlimited mailers",
    features: commonFeatures,
  },
];

const starterBusy = ref(false);
const activeTierId = ref<PlanCode | null>(null);

const onGetStartedClick = async (tierId: PlanCode) => {
  if (starterBusy.value) return;

  if (!auth.isAuthenticated) {
    auth.openLoginModal("/dashboard", "signup");
    return;
  }

  // If user already has "free" or "active", just go to dashboard
  if (auth.isSubscribed) {
    router.push("/dashboard");
    return;
  }

  starterBusy.value = true;
  activeTierId.value = tierId;

  try {
    const source = `home_pricing_${tierId.toLowerCase()}`;
    const { url } = await createCheckoutSession(tierId, source); // <-- key change
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
  <section id="pricing" class="bg-[var(--pc-navy)] py-16 sm:py-24 lg:py-28">
    <div
      class="mx-auto flex w-full max-w-[1660px] 2xl:max-w-[1760px] flex-col items-center gap-10 px-4 sm:px-6 md:px-10 xl:px-16 2xl:px-20"
    >
      <!-- Heading / copy (centered) -->
      <div class="max-w-3xl text-center">
        <span
          class="inline-flex items-center rounded-full bg-[var(--pc-cyan)] px-4 py-1 text-[12px] sm:text-[13px] font-semibold text-[var(--pc-navy)]"
        >
          PLANS &amp; PRICING
        </span>

        <h2
          class="mt-6 sm:mt-8 font-normal text-[var(--pc-text)] tracking-[-0.04em] text-[34px] leading-10 sm:text-[48px] sm:leading-[54px] md:text-[64px] md:leading-[72px] xl:text-[70px] xl:leading-20"
        >
          Flexible Plans for
          <br />
          Teams of Every Size
        </h2>

        <p
          class="mt-6 sm:mt-8 mx-auto max-w-[520px] text-[16px] sm:text-[20px] leading-[22px] sm:leading-[24.4px] text-[var(--pc-text-muted)]"
        >
          Simple, transparent pricing. Scale only when you need to.
        </p>
      </div>

      <!-- Calculator -->
      <PricingCalculator @recommendations="onRecommendations" />

      <!-- Cards row -->
      <div class="w-full">
        <div
          class="flex w-full flex-col gap-6 sm:gap-8 sm:flex-row sm:flex-wrap lg:flex-nowrap justify-center"
        >
          <!-- Paid tiers -->
          <article
            v-for="tier in tiers"
            :key="tier.id"
            class="relative flex w-full max-w-[360px] flex-col rounded-[14px] border bg-[var(--pc-card)] px-6 sm:px-8 pt-8 sm:pt-10 pb-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-all duration-300"
            :class="[
              badgeFor(tier.id)
                ? 'ring-2 ring-[var(--pc-cyan)] border-transparent'
                : 'border-[var(--pc-border)]',
            ]"
          >
            <!-- Recommendation badge -->
            <Transition name="badge-pop">
              <span
                v-if="badgeFor(tier.id)"
                :key="badgeFor(tier.id)!.label"
                class="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-[11px] sm:text-[12px] font-semibold"
                :class="
                  badgeFor(tier.id)!.color === 'cyan'
                    ? 'bg-[var(--pc-cyan)] text-[var(--pc-navy)]'
                    : 'bg-[var(--pc-yellow)] text-[var(--pc-navy)]'
                "
              >
                {{ badgeFor(tier.id)!.label }}
              </span>
            </Transition>
            <div>
              <h3
                class="text-[18px] sm:text-[20px] font-bold tracking-[0.02em] text-[var(--pc-text)] uppercase"
              >
                {{ tier.name }}
              </h3>

              <div class="mt-4 h-px w-full bg-[var(--pc-border)]" />

              <div class="mt-6 flex items-baseline gap-3">
                <span
                  class="text-[40px] leading-[46px] sm:text-[52px] sm:leading-[60px] xl:text-[60px] xl:leading-[68px] font-medium tracking-[-0.04em] text-[var(--pc-text)]"
                >
                  {{ tier.price }}
                </span>
                <span
                  class="text-[16px] sm:text-[18px] font-bold text-[var(--pc-cyan)]"
                >
                  {{ tier.perMonthLabel }}
                </span>
              </div>

              <div class="mt-4 h-px w-full bg-[var(--pc-border)]" />

              <p
                v-if="tier.includedLabel"
                class="mt-5 rounded-lg bg-[var(--pc-cyan)]/10 px-4 py-3 text-center text-[18px] sm:text-[22px] font-semibold tracking-[-0.02em] text-[var(--pc-cyan)]"
              >
                {{ tier.includedLabel }}
              </p>
            </div>

            <ul
              class="mt-6 sm:mt-8 text-[16px] sm:text-[20px] leading-9 text-[var(--pc-text-muted)]"
            >
              <li
                v-for="feature in tier.features"
                :key="feature.label"
                class="flex items-start gap-3"
              >
                <img
                  :src="feature.icon"
                  alt=""
                  class="mt-2 h-[15px] w-[15px] shrink-0"
                />
                <span>{{ feature.label }}</span>
              </li>
            </ul>

            <div class="mt-auto">
              <div class="mt-6 h-px w-full bg-[var(--pc-border)]" />
              <p
                v-if="tier.perMailerLabel"
                class="mt-1 text-[14px] sm:text-[16px] text-[var(--pc-text-soft)]"
              >
                {{ tier.perMailerLabel }}
              </p>

              <button
                type="button"
                @click="onGetStartedClick(tier.id)"
                :disabled="starterBusy"
                class="mt-5 sm:mt-6 inline-flex w-full items-center justify-center gap-3 rounded-md bg-[var(--pc-yellow)] px-6 py-3 text-[16px] sm:text-[18px] font-semibold text-[var(--pc-navy)] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <span v-if="!starterBusy || activeTierId !== tier.id">
                  Get Started
                </span>
                <span v-else>Redirecting…</span>
                <img
                  :src="rightDown"
                  alt=""
                  class="h-6 sm:h-[30px] w-6 sm:w-[30px]"
                />
              </button>
            </div>
          </article>

        </div>

        <!-- bottom note -->
        <p
          class="mt-8 sm:mt-10 text-center text-[14px] sm:text-[18px] leading-5 sm:leading-[22px] text-[var(--pc-cyan)]"
        >
          No hidden fees. Upgrade anytime.
        </p>
      </div>
    </div>
  </section>
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
