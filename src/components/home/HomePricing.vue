<!-- src/components/home/HomePricing.vue -->
<script setup lang="ts">
import { ref } from "vue";
import check from "@/assets/home/check-icon.svg?url";
import rightDown from "@/assets/home/right-down.svg?url";
import { createCheckoutSession, type PlanCode } from "@/api/billing";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { BRAND } from "@/config/brand";

const router = useRouter();
const auth = useAuthStore();

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

const enterpriseFeatures: Feature[] = [
  { icon: check, label: "Full Access to KPIs" },
  { icon: check, label: "ROI calculation" },
  { icon: check, label: "Job conversion rate" },
  { icon: check, label: "Top performing cities and zip codes" },
  { icon: check, label: "Dedicated account manager" },
  { icon: check, label: "Priority support" },
  { icon: check, label: "And much more..." },
];

// Public tiers – keep these in sync with Pricing.xlsx/backend limits
const tiers: Tier[] = [
  {
    id: "INSIGHT",
    name: "Insight",
    price: "$99",
    perMonthLabel: "/ Month",
    includedLabel: "Up to 1,000 mailers / month",
    features: commonFeatures,
  },
  {
    id: "PERFORMANCE",
    name: "Performance",
    price: "$249",
    perMonthLabel: "/ Month",
    includedLabel: "Up to 5,000 mailers / month",
    features: commonFeatures,
  },
  {
    id: "PRECISION",
    name: "Precision",
    price: "$499",
    perMonthLabel: "/ Month",
    includedLabel: "Up to 10,000 mailers / month",
    features: commonFeatures,
  },
  {
    id: "ELITE",
    name: "Elite",
    price: "$999",
    perMonthLabel: "/ Month",
    includedLabel: "Up to 25,000 mailers / month",
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
  <section id="pricing" class="bg-white py-16 sm:py-24 lg:py-28">
    <div
      class="mx-auto flex w-full max-w-[1660px] 2xl:max-w-[1760px] flex-col items-center gap-10 px-4 sm:px-6 md:px-10 xl:px-16 2xl:px-20"
    >
      <!-- Heading / copy (centered) -->
      <div class="max-w-3xl text-center">
        <span
          class="inline-flex items-center rounded-full bg-[#d6f4ec] px-4 py-1 text-[12px] sm:text-[13px] font-semibold text-[#0b2d4f]"
        >
          PLANS &amp; PRICING
        </span>

        <h2
          class="mt-6 sm:mt-8 font-normal text-[#0b2d4f] tracking-[-0.04em] text-[34px] leading-10 sm:text-[48px] sm:leading-[54px] md:text-[64px] md:leading-[72px] xl:text-[70px] xl:leading-20"
        >
          Flexible Plans for
          <br />
          Teams of Every Size
        </h2>

        <p
          class="mt-6 sm:mt-8 mx-auto max-w-[520px] text-[16px] sm:text-[20px] leading-[22px] sm:leading-[24.4px] text-black"
        >
          Simple, transparent pricing. Scale only when you need to.
        </p>
      </div>

      <!-- Cards row -->
      <div class="w-full">
        <div
          class="flex w-full flex-col gap-6 sm:gap-8 sm:flex-row sm:flex-wrap lg:flex-nowrap justify-center"
        >
          <!-- Paid tiers -->
          <article
            v-for="tier in tiers"
            :key="tier.id"
            class="flex w-full max-w-[360px] flex-col rounded-[14px] border border-[#24b39b] bg-white px-6 sm:px-8 pt-8 sm:pt-10 pb-8 shadow-[0_20px_60px_rgba(11,45,80,0.10)]"
          >
            <div>
              <h3
                class="text-[18px] sm:text-[20px] font-bold tracking-[0.02em] text-[#0b2d4f] uppercase"
              >
                {{ tier.name }}
              </h3>

              <div class="mt-4 h-px w-full bg-black/10" />

              <div class="mt-6 flex items-baseline gap-3">
                <span
                  class="text-[40px] leading-[46px] sm:text-[52px] sm:leading-[60px] xl:text-[60px] xl:leading-[68px] font-medium tracking-[-0.04em] text-[#0b2d4f]"
                >
                  {{ tier.price }}
                </span>
                <span
                  class="text-[16px] sm:text-[18px] font-bold text-[#24b39b]"
                >
                  {{ tier.perMonthLabel }}
                </span>
              </div>

              <div class="mt-4 h-px w-full bg-black/10" />
            </div>

            <ul
              class="mt-6 sm:mt-8 text-[16px] sm:text-[20px] leading-9 text-black"
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
              <div class="mt-6 h-px w-full bg-black/10" />
              <p
                v-if="tier.includedLabel"
                class="mt-3 text-[14px] sm:text-[16px] text-black/80"
              >
                {{ tier.includedLabel }}
              </p>
              <p
                v-if="tier.perMailerLabel"
                class="mt-1 text-[14px] sm:text-[16px] text-black/80"
              >
                {{ tier.perMailerLabel }}
              </p>

              <button
                type="button"
                @click="onGetStartedClick(tier.id)"
                :disabled="starterBusy"
                class="mt-5 sm:mt-6 inline-flex w-full items-center justify-center gap-3 rounded-md bg-[#24b39b] px-6 py-3 text-[16px] sm:text-[18px] font-semibold text-white hover:bg-[#1f9e86] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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

          <!-- Enterprise / Tailored -->
          <article
            class="flex w-full max-w-[360px] flex-col rounded-[14px] border border-[#24b39b] bg-white px-6 sm:px-8 pt-8 sm:pt-10 pb-8 shadow-[0_20px_60px_rgba(11,45,80,0.10)]"
          >
            <div>
              <h3
                class="text-[18px] sm:text-[20px] font-bold tracking-[0.02em] text-[#0b2d4f] uppercase"
              >
                Enterprise
              </h3>

              <div class="mt-4 h-px w-full bg-black/10" />

              <div class="mt-6 flex items-baseline gap-3">
                <span
                  class="text-[26px] sm:text-[26px] leading-7 sm:leading-8 font-semibold tracking-[-0.02em] text-[#0b2d4f]"
                >
                  Tailored
                </span>
              </div>

              <div class="mt-4 h-px w-full bg-black/10" />
            </div>

            <ul
              class="mt-8 sm:mt-8 text-[16px] sm:text-[20px] leading-9 text-black"
            >
              <li
                v-for="feature in enterpriseFeatures"
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
              <div class="mt-6 h-px w-full bg-black/10" />
              <p class="mt-3 text-[16px] sm:text-[18px] text-black/80">
                Custom pricing
              </p>

              <a
                :href="`mailto:${BRAND.email.support}`"
                class="mt-5 sm:mt-6 inline-flex w-full items-center justify-center gap-3 rounded-md bg-[#0b2d50] px-6 py-3 text-[16px] sm:text-[18px] font-semibold text-white hover:bg-[#123b6a]"
              >
                Contact Sales
                <img
                  :src="rightDown"
                  alt=""
                  class="h-6 sm:h-[30px] w-6 sm:w-[30px]"
                />
              </a>
            </div>
          </article>
        </div>

        <!-- bottom note -->
        <p
          class="mt-8 sm:mt-10 text-center text-[14px] sm:text-[18px] leading-5 sm:leading-[22px] text-[#24b39b]"
        >
          No hidden fees. Upgrade anytime.
        </p>
      </div>
    </div>
  </section>
</template>
