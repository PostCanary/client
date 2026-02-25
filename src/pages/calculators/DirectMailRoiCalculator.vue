<!-- src/pages/calculators/DirectMailRoiCalculator.vue -->
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import CalculatorHero from "@/components/calculators/CalculatorHero.vue";
import HomeFooter from "@/components/home/HomeFooter.vue";
import IndustryFAQ from "@/components/industry/IndustryFAQ.vue";
import { useAuthStore } from "@/stores/auth";
import {
  Calculator,
  Eye,
  EyeOff,
  BarChart3,
  Target,
  AlertTriangle,
} from "lucide-vue-next";
import type {
  CalculatorHeroContent,
  RoiCalculatorInputs,
  RoiCalculatorResults,
  IndustryType,
} from "@/types/calculator";
import type { IndustryFAQContent } from "@/types/industry";
import { INDUSTRY_DEFAULTS } from "@/types/calculator";

const auth = useAuthStore();

const heroContent: CalculatorHeroContent = {
  headline: "Direct Mail ROI Calculator",
  subheadline:
    "Discover how much revenue you're actually generating from direct mail—and how much is going untracked.",
  ctaText: "Calculate Your ROI",
};

// Form inputs with defaults
const inputs = ref<RoiCalculatorInputs>({
  monthlyMailVolume: 5000,
  costPerMailer: 0.75,
  averageTicketValue: 350,
  trackedConversionRate: 1.5,
  industry: "hvac",
});

// Track if user has calculated
const hasCalculated = ref(false);

// Update defaults when industry changes
watch(
  () => inputs.value.industry,
  (newIndustry) => {
    const defaults = INDUSTRY_DEFAULTS[newIndustry];
    inputs.value.averageTicketValue = defaults.ticketValue;
    inputs.value.trackedConversionRate = defaults.conversionRate;
  }
);

// Tracking capture assumption (QR/promo codes capture only 25% of actual conversions)
const TRACKING_CAPTURE_RATE = 0.25;

// Computed results
const results = computed<RoiCalculatorResults>(() => {
  const {
    monthlyMailVolume,
    costPerMailer,
    averageTicketValue,
    trackedConversionRate,
  } = inputs.value;

  const monthlyMailSpend = monthlyMailVolume * costPerMailer;
  const trackedConversionRateDecimal = trackedConversionRate / 100;

  // What they currently see
  const trackedConversions = Math.round(
    monthlyMailVolume * trackedConversionRateDecimal
  );
  const trackedRevenue = trackedConversions * averageTicketValue;
  const trackedRoi =
    monthlyMailSpend > 0
      ? ((trackedRevenue - monthlyMailSpend) / monthlyMailSpend) * 100
      : 0;

  // What's actually happening (assuming QR/promo codes only capture 25%)
  const estimatedTrueConversionRate =
    trackedConversionRateDecimal / TRACKING_CAPTURE_RATE;
  const estimatedTrueConversions = Math.round(
    monthlyMailVolume * estimatedTrueConversionRate
  );
  const estimatedTrueRevenue = estimatedTrueConversions * averageTicketValue;
  const trueRoi =
    monthlyMailSpend > 0
      ? ((estimatedTrueRevenue - monthlyMailSpend) / monthlyMailSpend) * 100
      : 0;

  // The gap
  const hiddenRevenue = estimatedTrueRevenue - trackedRevenue;
  const hiddenConversions = estimatedTrueConversions - trackedConversions;
  const annualHiddenRevenue = hiddenRevenue * 12;

  return {
    monthlyMailSpend,
    trackedRevenue,
    trackedConversions,
    estimatedTrueConversionRate: estimatedTrueConversionRate * 100,
    estimatedTrueRevenue,
    estimatedTrueConversions,
    hiddenRevenue,
    hiddenConversions,
    trackedRoi,
    trueRoi,
    annualHiddenRevenue,
    trackingCaptureRate: TRACKING_CAPTURE_RATE * 100,
  };
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US").format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

const calculate = () => {
  hasCalculated.value = true;
};

const onGetStarted = () => {
  if (!auth.isAuthenticated) {
    auth.openLoginModal("/dashboard", "signup");
    return;
  }
  window.location.href = "/dashboard";
};

const industryOptions: { value: IndustryType; label: string }[] = [
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "real_estate", label: "Real Estate" },
  { value: "other", label: "Other" },
];

const faqContent: IndustryFAQContent = {
  heading: "Direct Mail ROI FAQ",
  faqs: [
    {
      question: "Why do QR codes and promo codes miss so many conversions?",
      answer:
        "When customers receive your mailer, most don't scan a QR code or remember a promo code. They Google your company name, call the number directly, or visit your website. Studies show traditional tracking methods capture only 10-30% of actual mail-driven conversions.",
    },
    {
      question: "How accurate is this calculator?",
      answer:
        "This calculator uses industry benchmark data showing that QR codes and promo codes typically capture only 25% of actual conversions. Your actual results may vary based on your industry, offer, and customer behavior. PostCanary can show you your exact numbers through deterministic address matching.",
    },
    {
      question: "What conversion rate should I expect?",
      answer:
        "Direct mail response rates average 4.9% for prospect lists and 9% for house lists according to the DMA. Conversion rates (response to sale) typically range from 1-5% depending on your industry, offer quality, and targeting.",
    },
    {
      question: "How can I track my actual direct mail ROI?",
      answer:
        "PostCanary matches your mailed addresses directly against your CRM or job data—no QR codes or promo codes needed. Upload your mail list and customer data, and see exactly which mailers drove revenue, down to the dollar.",
    },
    {
      question: "What ROI should I expect from direct mail?",
      answer:
        "According to the ANA 2023 Response Rate Report, direct mail to house lists achieves an average ROI of 161%—higher than any other marketing channel. Even prospect lists typically see ROI above 100% when properly tracked.",
    },
  ],
};
</script>

<template>
  <div class="min-h-screen">
    <CalculatorHero :content="heroContent" />

    <!-- Calculator Section -->
    <section id="calculator" class="bg-[var(--pc-navy-2)] py-16 sm:py-24">
      <div
        class="mx-auto max-w-[1660px] 2xl:max-w-[1760px] px-4 sm:px-6 md:px-10 xl:px-16"
      >
        <div class="mx-auto max-w-5xl">
          <!-- Calculator Card -->
          <div
            class="bg-[var(--pc-card)] rounded-[14px] shadow-[0_18px_45px_rgba(0,0,0,0.35)] border border-[var(--pc-border)] overflow-hidden"
          >
            <!-- Calculator Header -->
            <div
              class="bg-gradient-to-r from-[var(--pc-navy)] to-[var(--pc-navy-2)] p-6 sm:p-8"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-full bg-white/10"
                >
                  <Calculator class="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 class="text-xl sm:text-2xl font-bold text-[var(--pc-text)]">
                    Calculate Your Direct Mail ROI
                  </h2>
                  <p class="text-[var(--pc-text-muted)] text-sm mt-1">
                    Enter your numbers to see what you're really earning
                  </p>
                </div>
              </div>
            </div>

            <!-- Calculator Form -->
            <div class="p-6 sm:p-8">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Industry -->
                <div>
                  <label
                    class="block text-sm font-medium text-[var(--pc-text)] mb-2"
                    for="industry"
                  >
                    Industry
                  </label>
                  <select
                    id="industry"
                    v-model="inputs.industry"
                    class="w-full rounded-lg bg-[var(--pc-navy)] border border-[var(--pc-border)] px-4 py-3 text-[var(--pc-text)] focus:border-[var(--pc-cyan)] focus:ring-2 focus:ring-[var(--pc-cyan)]/20 outline-none transition-colors"
                  >
                    <option
                      v-for="option in industryOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </div>

                <!-- Monthly Mail Volume -->
                <div>
                  <label
                    class="block text-sm font-medium text-[var(--pc-text)] mb-2"
                    for="volume"
                  >
                    Monthly Mail Volume
                  </label>
                  <input
                    id="volume"
                    v-model.number="inputs.monthlyMailVolume"
                    type="number"
                    min="100"
                    max="100000"
                    class="w-full rounded-lg bg-[var(--pc-navy)] border border-[var(--pc-border)] px-4 py-3 text-[var(--pc-text)] focus:border-[var(--pc-cyan)] focus:ring-2 focus:ring-[var(--pc-cyan)]/20 outline-none transition-colors"
                  />
                  <p class="text-xs text-[var(--pc-text-muted)] mt-1">
                    Pieces sent per month
                  </p>
                </div>

                <!-- Cost Per Mailer -->
                <div>
                  <label
                    class="block text-sm font-medium text-[var(--pc-text)] mb-2"
                    for="cost"
                  >
                    Cost Per Mailer
                  </label>
                  <div class="relative">
                    <span
                      class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pc-text-muted)]"
                      >$</span
                    >
                    <input
                      id="cost"
                      v-model.number="inputs.costPerMailer"
                      type="number"
                      min="0.25"
                      max="5"
                      step="0.05"
                      class="w-full rounded-lg bg-[var(--pc-navy)] border border-[var(--pc-border)] pl-8 pr-4 py-3 text-[var(--pc-text)] focus:border-[var(--pc-cyan)] focus:ring-2 focus:ring-[var(--pc-cyan)]/20 outline-none transition-colors"
                    />
                  </div>
                  <p class="text-xs text-[var(--pc-text-muted)] mt-1">
                    Print + postage per piece
                  </p>
                </div>

                <!-- Average Ticket Value -->
                <div>
                  <label
                    class="block text-sm font-medium text-[var(--pc-text)] mb-2"
                    for="ticket"
                  >
                    Average Ticket / Job Value
                  </label>
                  <div class="relative">
                    <span
                      class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pc-text-muted)]"
                      >$</span
                    >
                    <input
                      id="ticket"
                      v-model.number="inputs.averageTicketValue"
                      type="number"
                      min="50"
                      max="100000"
                      class="w-full rounded-lg bg-[var(--pc-navy)] border border-[var(--pc-border)] pl-8 pr-4 py-3 text-[var(--pc-text)] focus:border-[var(--pc-cyan)] focus:ring-2 focus:ring-[var(--pc-cyan)]/20 outline-none transition-colors"
                    />
                  </div>
                  <p class="text-xs text-[var(--pc-text-muted)] mt-1">
                    Revenue per customer/job
                  </p>
                </div>

                <!-- Tracked Conversion Rate -->
                <div class="md:col-span-2">
                  <label
                    class="block text-sm font-medium text-[var(--pc-text)] mb-2"
                    for="conversion"
                  >
                    Current Tracked Conversion Rate
                  </label>
                  <div class="flex items-center gap-4">
                    <input
                      id="conversion"
                      v-model.number="inputs.trackedConversionRate"
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      class="flex-1 h-2 bg-[var(--pc-navy)] rounded-lg appearance-none cursor-pointer accent-[var(--pc-cyan)]"
                    />
                    <div
                      class="w-20 text-center font-semibold text-[var(--pc-text)] bg-[var(--pc-navy)] rounded-lg px-3 py-2"
                    >
                      {{ inputs.trackedConversionRate.toFixed(1) }}%
                    </div>
                  </div>
                  <p class="text-xs text-[var(--pc-text-muted)] mt-1">
                    % of mailers that convert (via QR codes, promo codes, etc.)
                  </p>
                </div>
              </div>

              <!-- Calculate Button -->
              <div class="mt-8 flex justify-center">
                <button
                  @click="calculate"
                  class="inline-flex items-center gap-2 rounded-lg bg-[var(--pc-yellow)] px-8 py-4 text-lg font-semibold text-[var(--pc-navy)] shadow-md hover:brightness-110 cursor-pointer transition-all"
                >
                  <Calculator class="h-5 w-5" />
                  Calculate My ROI
                </button>
              </div>
            </div>
          </div>

          <!-- Results Section -->
          <div
            v-if="hasCalculated"
            class="mt-12 space-y-8 animate-fade-in"
          >
            <!-- Key Insight Banner -->
            <div
              class="bg-rose-900/40 border border-amber-700/50 rounded-[14px] p-6 sm:p-8"
            >
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-800/50"
                >
                  <AlertTriangle class="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h3 class="text-xl font-bold text-amber-300">
                    You're Missing
                    {{ formatCurrency(results.annualHiddenRevenue) }}/Year in
                    Attribution
                  </h3>
                  <p class="text-amber-200/80 mt-2">
                    Based on industry data, QR codes and promo codes typically
                    capture only {{ results.trackingCaptureRate }}% of actual
                    mail-driven conversions. The rest of your customers Google
                    you, call directly, or walk in—and you have no way to
                    connect them to your mailers.
                  </p>
                </div>
              </div>
            </div>

            <!-- Side by Side Comparison -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- What You See -->
              <div
                class="bg-[var(--pc-navy)] rounded-[14px] shadow-[0_18px_45px_rgba(0,0,0,0.35)] border border-[var(--pc-border)] overflow-hidden"
              >
                <div class="bg-[var(--pc-navy-2)] p-4 flex items-center gap-3">
                  <EyeOff class="h-5 w-5 text-[var(--pc-text-muted)]" />
                  <h3 class="font-semibold text-[var(--pc-text-muted)]">
                    What You Currently Track
                  </h3>
                </div>
                <div class="p-6 space-y-4">
                  <div class="flex justify-between items-center py-3 border-b border-[var(--pc-border)]">
                    <span class="text-[var(--pc-text-muted)]">Monthly Mail Spend</span>
                    <span class="font-semibold text-[var(--pc-text)]">{{
                      formatCurrency(results.monthlyMailSpend)
                    }}</span>
                  </div>
                  <div class="flex justify-between items-center py-3 border-b border-[var(--pc-border)]">
                    <span class="text-[var(--pc-text-muted)]">Tracked Conversions</span>
                    <span class="font-semibold text-[var(--pc-text)]">{{
                      formatNumber(results.trackedConversions)
                    }}</span>
                  </div>
                  <div class="flex justify-between items-center py-3 border-b border-[var(--pc-border)]">
                    <span class="text-[var(--pc-text-muted)]">Tracked Revenue</span>
                    <span class="font-semibold text-[var(--pc-text)]">{{
                      formatCurrency(results.trackedRevenue)
                    }}</span>
                  </div>
                  <div class="flex justify-between items-center py-3">
                    <span class="text-[var(--pc-text-muted)]">Apparent ROI</span>
                    <span
                      class="font-bold text-lg"
                      :class="
                        results.trackedRoi >= 0
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      "
                      >{{ formatPercent(results.trackedRoi) }}</span
                    >
                  </div>
                </div>
              </div>

              <!-- What's Really Happening -->
              <div
                class="bg-[var(--pc-card)] rounded-[14px] shadow-[0_18px_45px_rgba(0,0,0,0.35)] border-2 border-[var(--pc-cyan)] overflow-hidden"
              >
                <div
                  class="bg-gradient-to-r from-[var(--pc-cyan)] to-[var(--pc-cyan)]/80 p-4 flex items-center gap-3"
                >
                  <Eye class="h-5 w-5 text-white" />
                  <h3 class="font-semibold text-white">
                    What's Actually Happening
                  </h3>
                </div>
                <div class="p-6 space-y-4">
                  <div class="flex justify-between items-center py-3 border-b border-[var(--pc-border)]">
                    <span class="text-[var(--pc-text-muted)]">Monthly Mail Spend</span>
                    <span class="font-semibold text-[var(--pc-text)]">{{
                      formatCurrency(results.monthlyMailSpend)
                    }}</span>
                  </div>
                  <div class="flex justify-between items-center py-3 border-b border-[var(--pc-border)]">
                    <span class="text-[var(--pc-text-muted)]">Estimated True Conversions</span>
                    <span class="font-semibold text-[var(--pc-cyan)]">{{
                      formatNumber(results.estimatedTrueConversions)
                    }}</span>
                  </div>
                  <div class="flex justify-between items-center py-3 border-b border-[var(--pc-border)]">
                    <span class="text-[var(--pc-text-muted)]">Estimated True Revenue</span>
                    <span class="font-semibold text-[var(--pc-cyan)]">{{
                      formatCurrency(results.estimatedTrueRevenue)
                    }}</span>
                  </div>
                  <div class="flex justify-between items-center py-3">
                    <span class="text-[var(--pc-text-muted)]">Estimated True ROI</span>
                    <span class="font-bold text-lg text-[var(--pc-cyan)]">{{
                      formatPercent(results.trueRoi)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Hidden Revenue Breakdown -->
            <div
              class="bg-[var(--pc-card)] rounded-[14px] shadow-[0_18px_45px_rgba(0,0,0,0.35)] border border-[var(--pc-border)] p-6 sm:p-8"
            >
              <h3
                class="text-xl font-bold text-[var(--pc-text)] mb-6 flex items-center gap-2"
              >
                <BarChart3 class="h-6 w-6 text-[var(--pc-cyan)]" />
                Revenue Attribution Gap
              </h3>

              <!-- Visual Bar -->
              <div class="mb-6">
                <div class="flex h-12 rounded-lg overflow-hidden">
                  <div
                    class="bg-[var(--pc-text-muted)]/40 flex items-center justify-center text-sm font-medium text-[var(--pc-text)]"
                    :style="{
                      width: `${(results.trackedRevenue / results.estimatedTrueRevenue) * 100}%`,
                    }"
                  >
                    Tracked
                  </div>
                  <div
                    class="bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center text-sm font-medium text-white"
                    :style="{
                      width: `${(results.hiddenRevenue / results.estimatedTrueRevenue) * 100}%`,
                    }"
                  >
                    Untracked
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div
                  class="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50"
                >
                  <div class="text-sm font-medium text-amber-400 mb-1">
                    Hidden Monthly Revenue
                  </div>
                  <div class="text-2xl font-bold text-amber-300">
                    {{ formatCurrency(results.hiddenRevenue) }}
                  </div>
                </div>
                <div
                  class="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50"
                >
                  <div class="text-sm font-medium text-amber-400 mb-1">
                    Hidden Conversions/Month
                  </div>
                  <div class="text-2xl font-bold text-amber-300">
                    {{ formatNumber(results.hiddenConversions) }}
                  </div>
                </div>
                <div
                  class="bg-rose-900/30 rounded-xl p-5 border border-rose-700/50"
                >
                  <div class="text-sm font-medium text-rose-400 mb-1">
                    Annual Hidden Revenue
                  </div>
                  <div class="text-2xl font-bold text-rose-300">
                    {{ formatCurrency(results.annualHiddenRevenue) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- CTA Section -->
            <div
              class="bg-gradient-to-r from-[var(--pc-navy)] to-[var(--pc-navy-2)] rounded-[14px] p-8 sm:p-10 text-center"
            >
              <h3 class="text-2xl sm:text-3xl font-bold text-[var(--pc-text)] mb-4">
                See Your Real Numbers with PostCanary
              </h3>
              <p class="text-[var(--pc-text-muted)] max-w-2xl mx-auto mb-8">
                Stop guessing. PostCanary matches your mailed addresses directly
                to your CRM data—no QR codes or promo codes needed. Upload your
                files and get your actual ROI in minutes.
              </p>
              <button
                @click="onGetStarted"
                class="inline-flex items-center gap-2 rounded-lg bg-[var(--pc-yellow)] px-8 py-4 text-lg font-semibold text-[var(--pc-navy)] shadow-md hover:brightness-110 cursor-pointer transition-all"
              >
                <Target class="h-5 w-5" />
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Industry Benchmarks -->
    <section class="bg-[var(--pc-navy)] py-16 sm:py-20">
      <div
        class="mx-auto max-w-[1660px] 2xl:max-w-[1760px] px-4 sm:px-6 md:px-10 xl:px-16"
      >
        <div class="mx-auto max-w-4xl text-center mb-12">
          <h2
            class="text-[var(--pc-text)] text-[28px] sm:text-[36px] font-normal tracking-[-0.04em]"
          >
            Industry Benchmarks
          </h2>
          <p class="text-[var(--pc-text-muted)] mt-4">
            Data from the Association of National Advertisers, DMA, and industry
            studies
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div
            class="bg-[var(--pc-card)] rounded-[14px] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)] border border-[var(--pc-border)] text-center"
          >
            <div class="text-3xl font-bold text-[var(--pc-cyan)]">161%</div>
            <div class="text-sm text-[var(--pc-text-muted)] mt-2">
              Average Direct Mail ROI (House List)
            </div>
          </div>
          <div
            class="bg-[var(--pc-card)] rounded-[14px] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)] border border-[var(--pc-border)] text-center"
          >
            <div class="text-3xl font-bold text-[var(--pc-cyan)]">9%</div>
            <div class="text-sm text-[var(--pc-text-muted)] mt-2">
              Average Response Rate (House List)
            </div>
          </div>
          <div
            class="bg-[var(--pc-card)] rounded-[14px] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)] border border-[var(--pc-border)] text-center"
          >
            <div class="text-3xl font-bold text-[var(--pc-cyan)]">70-90%</div>
            <div class="text-sm text-[var(--pc-text-muted)] mt-2">
              Conversions Missed by QR/Promo Codes
            </div>
          </div>
          <div
            class="bg-[var(--pc-card)] rounded-[14px] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)] border border-[var(--pc-border)] text-center"
          >
            <div class="text-3xl font-bold text-[var(--pc-cyan)]">6x</div>
            <div class="text-sm text-[var(--pc-text-muted)] mt-2">
              More Revenue from Mail vs Digital Leads
            </div>
          </div>
        </div>
      </div>
    </section>

    <IndustryFAQ :content="faqContent" />
    <HomeFooter />
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
