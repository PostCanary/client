<!-- src/pages/calculators/SavingsCalculator.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import CalculatorHero from "@/components/calculators/CalculatorHero.vue";

import IndustryFAQ from "@/components/industry/IndustryFAQ.vue";
import { useAuthStore } from "@/stores/auth";
import {
  Calculator,
  Clock,
  DollarSign,
  Target,
  TrendingUp,
  CheckCircle,
  Zap,
  Award,
} from "lucide-vue-next";
import type {
  CalculatorHeroContent,
  SavingsCalculatorInputs,
  SavingsCalculatorResults,
  MatchingFrequency,
  PricingTier,
} from "@/types/calculator";
import type { IndustryFAQContent } from "@/types/industry";
import { PRICING_TIERS, FREQUENCY_MULTIPLIERS } from "@/types/calculator";

const auth = useAuthStore();

const heroContent: CalculatorHeroContent = {
  headline: "PostCanary Savings Calculator",
  subheadline:
    "See how much time and money you'll save by replacing manual data matching with deterministic address matching.",
  ctaText: "Calculate Your Savings",
};

// Form inputs with defaults
const inputs = ref<SavingsCalculatorInputs>({
  monthlyMailVolume: 5000,
  hoursSpentMatching: 4,
  matchingFrequency: "monthly",
  hourlyLaborCost: 35,
  currentMatchAccuracy: 40,
});

// Track if user has calculated
const hasCalculated = ref(false);

// Get recommended tier based on volume
const getRecommendedTier = (volume: number): PricingTier => {
  const tier = PRICING_TIERS.find((t) => volume <= t.maxVolume);
  // Always return the last tier if no match found
  return tier ?? PRICING_TIERS[PRICING_TIERS.length - 1]!;
};

// Computed results
const results = computed<SavingsCalculatorResults>(() => {
  const {
    monthlyMailVolume,
    hoursSpentMatching,
    matchingFrequency,
    hourlyLaborCost,
    currentMatchAccuracy,
  } = inputs.value;

  const frequencyMultiplier = FREQUENCY_MULTIPLIERS[matchingFrequency];

  // Labor costs
  const hoursPerYear = hoursSpentMatching * frequencyMultiplier;
  const annualLaborCost = hoursPerYear * hourlyLaborCost;
  const monthlyLaborCost = annualLaborCost / 12;

  // PostCanary costs
  const recommendedTier = getRecommendedTier(monthlyMailVolume);
  const monthlyPostCanaryCost = recommendedTier.monthlyPrice;
  const annualPostCanaryCost = monthlyPostCanaryCost * 12;

  // Savings
  const netAnnualSavings = annualLaborCost - annualPostCanaryCost;
  const netMonthlySavings = netAnnualSavings / 12;

  // Accuracy improvement (PostCanary = 95% accuracy)
  const postcanary_accuracy = 95;
  const accuracyImprovement = postcanary_accuracy - currentMatchAccuracy;

  // Time saved (PostCanary takes ~2 minutes vs hours of manual work)
  const hoursSavedPerYear = hoursPerYear - (frequencyMultiplier * (2 / 60)); // 2 minutes per session

  // ROI percentage
  const roiPercentage =
    annualPostCanaryCost > 0
      ? ((netAnnualSavings / annualPostCanaryCost) * 100)
      : 0;

  return {
    annualLaborCost,
    monthlyLaborCost,
    recommendedTier,
    annualPostCanaryCost,
    monthlyPostCanaryCost,
    netAnnualSavings,
    netMonthlySavings,
    accuracyImprovement,
    hoursPerYear,
    hoursSavedPerYear,
    roiPercentage,
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
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
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

const frequencyOptions: { value: MatchingFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
];

const faqContent: IndustryFAQContent = {
  heading: "PostCanary Savings FAQ",
  faqs: [
    {
      question: "How does PostCanary save time compared to manual matching?",
      answer:
        "Manual data matching in Excel typically takes 2-4+ hours per session—comparing addresses, handling formatting differences, and trying to find matches. PostCanary does this automatically in seconds. Upload your files, and results appear in under 2 minutes.",
    },
    {
      question: "What's included in each PostCanary tier?",
      answer:
        "All tiers include the same core features: full ROI calculation, conversion rate tracking, revenue attribution, and geographic performance analysis (top cities/zip codes). Tiers differ only by monthly mail volume capacity.",
    },
    {
      question: "How accurate is PostCanary compared to manual matching?",
      answer:
        "PostCanary achieves 95%+ match accuracy using advanced address normalization. It handles variations like 'Ave' vs 'Avenue', unit numbers, and common data entry differences that make manual matching error-prone.",
    },
    {
      question: "What if I exceed my tier's mail volume?",
      answer:
        "You can upgrade your tier at any time. There are no overage charges or penalties—just move to the next tier when your volume grows.",
    },
    {
      question: "Is there a free trial?",
      answer:
        "Yes! You can sign up and try PostCanary with your actual data before committing to a subscription. See your real ROI numbers before you pay.",
    },
  ],
};
</script>

<template>
  <div>
    <CalculatorHero :content="heroContent" />

    <!-- Calculator Section -->
    <section id="calculator" class="bg-[var(--mkt-bg)] py-16 sm:py-24">
      <div
        class="mx-auto max-w-[1660px] 2xl:max-w-[1760px] px-4 sm:px-6 md:px-10 xl:px-16"
      >
        <div class="mx-auto max-w-5xl">
          <!-- Calculator Card -->
          <div
            class="bg-[var(--mkt-card)] rounded-[14px] shadow-[var(--mkt-card-shadow-lg)] border border-[var(--mkt-border)] overflow-hidden"
          >
            <!-- Calculator Header -->
            <div
              class="bg-gradient-to-r from-[var(--mkt-bg-alt)] to-[var(--mkt-bg)] p-6 sm:p-8"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-full bg-white/10"
                >
                  <Clock class="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 class="text-xl sm:text-2xl font-bold text-[var(--mkt-text)]">
                    Calculate Your Savings
                  </h2>
                  <p class="text-[var(--mkt-text-muted)] text-sm mt-1">
                    Time and money saved with PostCanary
                  </p>
                </div>
              </div>
            </div>

            <!-- Calculator Form -->
            <div class="p-6 sm:p-8">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Monthly Mail Volume -->
                <div>
                  <label
                    class="block text-sm font-medium text-[var(--mkt-text)] mb-2"
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
                    class="w-full rounded-lg bg-[var(--mkt-bg-alt)] border border-[var(--mkt-border)] px-4 py-3 text-[var(--mkt-text)] focus:border-[var(--mkt-teal)] focus:ring-2 focus:ring-[var(--mkt-teal)]/20 outline-none transition-colors"
                  />
                  <p class="text-xs text-[var(--mkt-text-muted)] mt-1">
                    Pieces mailed per month
                  </p>
                </div>

                <!-- Hours Spent Matching -->
                <div>
                  <label
                    class="block text-sm font-medium text-[var(--mkt-text)] mb-2"
                    for="hours"
                  >
                    Hours Spent on Manual Matching
                  </label>
                  <input
                    id="hours"
                    v-model.number="inputs.hoursSpentMatching"
                    type="number"
                    min="0.5"
                    max="40"
                    step="0.5"
                    class="w-full rounded-lg bg-[var(--mkt-bg-alt)] border border-[var(--mkt-border)] px-4 py-3 text-[var(--mkt-text)] focus:border-[var(--mkt-teal)] focus:ring-2 focus:ring-[var(--mkt-teal)]/20 outline-none transition-colors"
                  />
                  <p class="text-xs text-[var(--mkt-text-muted)] mt-1">
                    Per matching session
                  </p>
                </div>

                <!-- Matching Frequency -->
                <div>
                  <label
                    class="block text-sm font-medium text-[var(--mkt-text)] mb-2"
                    for="frequency"
                  >
                    How Often Do You Match Data?
                  </label>
                  <select
                    id="frequency"
                    v-model="inputs.matchingFrequency"
                    class="w-full rounded-lg bg-[var(--mkt-bg-alt)] border border-[var(--mkt-border)] px-4 py-3 text-[var(--mkt-text)] focus:border-[var(--mkt-teal)] focus:ring-2 focus:ring-[var(--mkt-teal)]/20 outline-none transition-colors"
                  >
                    <option
                      v-for="option in frequencyOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </div>

                <!-- Hourly Labor Cost -->
                <div>
                  <label
                    class="block text-sm font-medium text-[var(--mkt-text)] mb-2"
                    for="labor"
                  >
                    Hourly Labor Cost
                  </label>
                  <div class="relative">
                    <span
                      class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--mkt-text-muted)]"
                      >$</span
                    >
                    <input
                      id="labor"
                      v-model.number="inputs.hourlyLaborCost"
                      type="number"
                      min="15"
                      max="150"
                      class="w-full rounded-lg bg-[var(--mkt-bg-alt)] border border-[var(--mkt-border)] pl-8 pr-4 py-3 text-[var(--mkt-text)] focus:border-[var(--mkt-teal)] focus:ring-2 focus:ring-[var(--mkt-teal)]/20 outline-none transition-colors"
                    />
                  </div>
                  <p class="text-xs text-[var(--mkt-text-muted)] mt-1">
                    Cost of whoever does the matching
                  </p>
                </div>

                <!-- Current Match Accuracy -->
                <div class="md:col-span-2">
                  <label
                    class="block text-sm font-medium text-[var(--mkt-text)] mb-2"
                    for="accuracy"
                  >
                    Current Manual Match Accuracy (Estimate)
                  </label>
                  <div class="flex items-center gap-4">
                    <input
                      id="accuracy"
                      v-model.number="inputs.currentMatchAccuracy"
                      type="range"
                      min="10"
                      max="90"
                      step="5"
                      class="flex-1 h-2 bg-[var(--mkt-bg-alt)] rounded-lg appearance-none cursor-pointer accent-[var(--mkt-teal)]"
                    />
                    <div
                      class="w-20 text-center font-semibold text-[var(--mkt-text)] bg-[var(--mkt-bg-alt)] rounded-lg px-3 py-2"
                    >
                      {{ inputs.currentMatchAccuracy }}%
                    </div>
                  </div>
                  <p class="text-xs text-[var(--mkt-text-muted)] mt-1">
                    What % of matches do you think you find manually?
                  </p>
                </div>
              </div>

              <!-- Calculate Button -->
              <div class="mt-8 flex justify-center">
                <button
                  @click="calculate"
                  class="inline-flex items-center gap-2 rounded-lg bg-[var(--mkt-yellow)] px-8 py-4 text-lg font-semibold text-[var(--mkt-bg-alt)] shadow-md hover:brightness-110 cursor-pointer transition-all"
                >
                  <Calculator class="h-5 w-5" />
                  Calculate My Savings
                </button>
              </div>
            </div>
          </div>

          <!-- Results Section -->
          <div v-if="hasCalculated" class="mt-12 space-y-8 animate-fade-in">
            <!-- Recommended Tier Banner -->
            <div
              class="bg-gradient-to-r from-[var(--mkt-teal)]/80 to-[var(--mkt-teal)]/60 rounded-[14px] p-6 sm:p-8 text-white"
            >
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <Award class="h-6 w-6" />
                    <span class="text-sm font-medium text-white/80"
                      >Recommended for You</span
                    >
                  </div>
                  <h3 class="text-2xl sm:text-3xl font-bold">
                    {{ results.recommendedTier.name }}
                    - {{ formatCurrency(results.recommendedTier.monthlyPrice) }}/mo
                  </h3>
                  <p class="text-white/80 mt-1">
                    {{
                      results.recommendedTier.maxVolume === Infinity
                        ? "Unlimited mailers/month"
                        : `Up to ${formatNumber(results.recommendedTier.maxVolume)} mailers/month`
                    }}
                  </p>
                </div>
                <button
                  @click="onGetStarted"
                  class="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-[var(--mkt-bg-alt)] font-semibold shadow-md hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Get Started
                </button>
              </div>
            </div>

            <!-- Cost Comparison -->
            <div
              class="bg-[var(--mkt-card)] rounded-[14px] shadow-[var(--mkt-card-shadow-lg)] border border-[var(--mkt-border)] p-6 sm:p-8"
            >
              <h3
                class="text-xl font-bold text-[var(--mkt-text)] mb-6 flex items-center gap-2"
              >
                <DollarSign class="h-6 w-6 text-[var(--mkt-teal)]" />
                Cost Comparison
              </h3>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Manual Process -->
                <div class="bg-[var(--mkt-bg-alt)] rounded-xl p-6">
                  <h4 class="font-semibold text-[var(--mkt-text-muted)] mb-4">
                    Current Manual Process
                  </h4>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-[var(--mkt-text-muted)]">Hours per year</span>
                      <span class="font-medium text-[var(--mkt-text)]"
                        >{{ formatNumber(results.hoursPerYear) }} hrs</span
                      >
                    </div>
                    <div class="flex justify-between">
                      <span class="text-[var(--mkt-text-muted)]">Labor cost/hr</span>
                      <span class="font-medium text-[var(--mkt-text)]"
                        >{{ formatCurrency(inputs.hourlyLaborCost) }}</span
                      >
                    </div>
                    <div
                      class="flex justify-between pt-3 border-t border-[var(--mkt-border)]"
                    >
                      <span class="font-medium text-[var(--mkt-text)]"
                        >Annual Cost</span
                      >
                      <span class="font-bold text-lg text-rose-400">{{
                        formatCurrency(results.annualLaborCost)
                      }}</span>
                    </div>
                  </div>
                </div>

                <!-- With PostCanary -->
                <div class="bg-[var(--mkt-teal)]/10 rounded-xl p-6 border border-[var(--mkt-teal)]/30">
                  <h4 class="font-semibold text-[var(--mkt-text)] mb-4">
                    With PostCanary
                  </h4>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-[var(--mkt-text-muted)]">Monthly subscription</span>
                      <span class="font-medium text-[var(--mkt-text)]">{{
                        formatCurrency(results.monthlyPostCanaryCost)
                      }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-[var(--mkt-text-muted)]">Time per analysis</span>
                      <span class="font-medium text-[var(--mkt-text)]">~2 minutes</span>
                    </div>
                    <div
                      class="flex justify-between pt-3 border-t border-[var(--mkt-teal)]/30"
                    >
                      <span class="font-medium text-[var(--mkt-text)]"
                        >Annual Cost</span
                      >
                      <span class="font-bold text-lg text-[var(--mkt-teal)]">{{
                        formatCurrency(results.annualPostCanaryCost)
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Visual Bar Comparison -->
              <div class="mt-8">
                <div class="text-sm text-[var(--mkt-text-soft)] mb-2">Annual Cost Comparison</div>
                <div class="space-y-2">
                  <div class="flex items-center gap-4">
                    <span class="w-24 text-sm text-[var(--mkt-text-soft)]">Manual</span>
                    <div class="flex-1 bg-[var(--mkt-bg-alt)] rounded-full h-6 overflow-hidden">
                      <div
                        class="bg-rose-500 h-full rounded-full flex items-center justify-end pr-3"
                        :style="{
                          width: `${Math.min(100, (results.annualLaborCost / Math.max(results.annualLaborCost, results.annualPostCanaryCost)) * 100)}%`,
                        }"
                      >
                        <span class="text-xs font-medium text-white">{{
                          formatCurrency(results.annualLaborCost)
                        }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <span class="w-24 text-sm text-[var(--mkt-text-soft)]">PostCanary</span>
                    <div class="flex-1 bg-[var(--mkt-bg-alt)] rounded-full h-6 overflow-hidden">
                      <div
                        class="bg-[var(--mkt-teal)] h-full rounded-full flex items-center justify-end pr-3"
                        :style="{
                          width: `${results.annualPostCanaryCost > 0 ? Math.max(5, Math.min(100, (results.annualPostCanaryCost / Math.max(results.annualLaborCost, results.annualPostCanaryCost)) * 100)) : 5}%`,
                        }"
                      >
                        <span class="text-xs font-medium text-white">{{
                          formatCurrency(results.annualPostCanaryCost)
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Savings Metrics -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                class="bg-emerald-900/30 rounded-xl p-6 border border-emerald-700/50"
                v-if="results.netAnnualSavings > 0"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-emerald-400">
                    Annual Savings
                  </div>
                  <DollarSign class="w-5 h-5 text-emerald-400" />
                </div>
                <div class="text-2xl font-bold text-emerald-300">
                  {{ formatCurrency(results.netAnnualSavings) }}
                </div>
                <div class="text-xs text-emerald-400/70 mt-1">per year</div>
              </div>

              <div
                class="bg-[var(--mkt-teal)]/10 rounded-xl p-6 border border-[var(--mkt-teal)]/30"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-[var(--mkt-text-muted)]">
                    Hours Saved
                  </div>
                  <Clock class="w-5 h-5 text-[var(--mkt-teal)]" />
                </div>
                <div class="text-2xl font-bold text-[var(--mkt-text)]">
                  {{ formatNumber(results.hoursSavedPerYear) }}
                </div>
                <div class="text-xs text-[var(--mkt-text-muted)] mt-1">hours per year</div>
              </div>

              <div
                class="bg-purple-900/30 rounded-xl p-6 border border-purple-700/50"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-purple-400">
                    Accuracy Gain
                  </div>
                  <Target class="w-5 h-5 text-purple-400" />
                </div>
                <div class="text-2xl font-bold text-purple-300">
                  +{{ results.accuracyImprovement }}%
                </div>
                <div class="text-xs text-purple-400/70 mt-1">
                  {{ inputs.currentMatchAccuracy }}% → 95%
                </div>
              </div>

              <div
                class="bg-amber-900/30 rounded-xl p-6 border border-amber-700/50"
                v-if="results.roiPercentage > 0"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-amber-400">
                    ROI
                  </div>
                  <TrendingUp class="w-5 h-5 text-amber-400" />
                </div>
                <div class="text-2xl font-bold text-amber-300">
                  {{ formatNumber(results.roiPercentage) }}%
                </div>
                <div class="text-xs text-amber-400/70 mt-1">return on investment</div>
              </div>
            </div>

            <!-- Benefits List -->
            <div
              class="bg-[var(--mkt-bg-alt)] rounded-[14px] border border-[var(--mkt-border)] p-6 sm:p-8"
            >
              <h3 class="text-lg font-bold text-[var(--mkt-text)] mb-6">
                What You Get with PostCanary
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex items-start gap-3">
                  <CheckCircle class="h-5 w-5 text-[var(--mkt-teal)] shrink-0 mt-0.5" />
                  <div>
                    <div class="font-medium text-[var(--mkt-text)]">
                      Instant Results
                    </div>
                    <p class="text-sm text-[var(--mkt-text-muted)]">
                      Upload files, get ROI in under 2 minutes
                    </p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <CheckCircle class="h-5 w-5 text-[var(--mkt-teal)] shrink-0 mt-0.5" />
                  <div>
                    <div class="font-medium text-[var(--mkt-text)]">
                      95%+ Match Accuracy
                    </div>
                    <p class="text-sm text-[var(--mkt-text-muted)]">
                      Advanced address normalization handles variations
                    </p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <CheckCircle class="h-5 w-5 text-[var(--mkt-teal)] shrink-0 mt-0.5" />
                  <div>
                    <div class="font-medium text-[var(--mkt-text)]">
                      Geographic Insights
                    </div>
                    <p class="text-sm text-[var(--mkt-text-muted)]">
                      See top-performing cities and zip codes
                    </p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <CheckCircle class="h-5 w-5 text-[var(--mkt-teal)] shrink-0 mt-0.5" />
                  <div>
                    <div class="font-medium text-[var(--mkt-text)]">
                      Revenue Attribution
                    </div>
                    <p class="text-sm text-[var(--mkt-text-muted)]">
                      Connect every dollar to the mailer that drove it
                    </p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <CheckCircle class="h-5 w-5 text-[var(--mkt-teal)] shrink-0 mt-0.5" />
                  <div>
                    <div class="font-medium text-[var(--mkt-text)]">
                      No Integration Required
                    </div>
                    <p class="text-sm text-[var(--mkt-text-muted)]">
                      Works with any CRM—just export CSVs
                    </p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <CheckCircle class="h-5 w-5 text-[var(--mkt-teal)] shrink-0 mt-0.5" />
                  <div>
                    <div class="font-medium text-[var(--mkt-text)]">
                      Secure & Private
                    </div>
                    <p class="text-sm text-[var(--mkt-text-muted)]">
                      Data encrypted, processed, and deleted within 24 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- CTA Section -->
            <div
              class="bg-gradient-to-r from-[var(--mkt-bg-alt)] to-[var(--mkt-bg)] rounded-[14px] p-8 sm:p-10 text-center"
            >
              <h3 class="text-2xl sm:text-3xl font-bold text-[var(--mkt-text)] mb-4">
                Start Saving Today
              </h3>
              <p class="text-[var(--mkt-text-muted)] max-w-2xl mx-auto mb-8">
                Stop wasting hours on manual data matching. Get accurate
                attribution in minutes and focus on what matters—growing your
                business.
              </p>
              <button
                @click="onGetStarted"
                class="inline-flex items-center gap-2 rounded-lg bg-[var(--mkt-yellow)] px-8 py-4 text-lg font-semibold text-[var(--mkt-bg-alt)] shadow-md hover:brightness-110 cursor-pointer transition-all"
              >
                <Zap class="h-5 w-5" />
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Tiers Reference -->
    <section class="bg-[var(--mkt-bg-alt)] py-16 sm:py-20">
      <div
        class="mx-auto max-w-[1660px] 2xl:max-w-[1760px] px-4 sm:px-6 md:px-10 xl:px-16"
      >
        <div class="mx-auto max-w-4xl text-center mb-12">
          <h2
            class="text-[var(--mkt-text)] text-[28px] sm:text-[36px] font-normal tracking-[-0.04em]"
          >
            Simple, Transparent Pricing
          </h2>
          <p class="text-[var(--mkt-text-muted)] mt-4">
            Scale only when you need to. No hidden fees.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div
            v-for="tier in PRICING_TIERS"
            :key="tier.name"
            class="bg-[var(--mkt-card)] rounded-[14px] p-6 shadow-[var(--mkt-card-shadow-lg)] border border-[var(--mkt-border)] text-center"
            :class="{ 'ring-2 ring-[var(--mkt-teal)]': tier.name === results.recommendedTier.name && hasCalculated }"
          >
            <div class="text-sm font-medium text-[var(--mkt-teal)] mb-1">
              {{ tier.name }}
            </div>
            <div class="text-2xl font-bold text-[var(--mkt-text)]">
              ${{ tier.monthlyPrice }}
            </div>
            <div class="text-xs text-[var(--mkt-text-muted)] mt-1">
              {{ tier.maxVolume === Infinity ? "Unlimited" : `Up to ${formatNumber(tier.maxVolume)}` }}
            </div>
            <div
              v-if="tier.name === results.recommendedTier.name && hasCalculated"
              class="mt-2 text-xs font-medium text-[var(--mkt-teal)]"
            >
              Recommended
            </div>
          </div>
        </div>
      </div>
    </section>

    <IndustryFAQ :content="faqContent" />
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
