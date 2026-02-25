<!-- src/pages/calculators/AttributionGapCalculator.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import CalculatorHero from "@/components/calculators/CalculatorHero.vue";
import HomeFooter from "@/components/home/HomeFooter.vue";
import IndustryFAQ from "@/components/industry/IndustryFAQ.vue";
import { useAuthStore } from "@/stores/auth";
import {
  Calculator,
  PieChart,
  DollarSign,
  Users,
  Target,
  TrendingUp,
  AlertCircle,
} from "lucide-vue-next";
import type {
  CalculatorHeroContent,
  AttributionGapInputs,
  AttributionGapResults,
} from "@/types/calculator";
import type { IndustryFAQContent } from "@/types/industry";

const auth = useAuthStore();

const heroContent: CalculatorHeroContent = {
  headline: "Attribution Gap Calculator",
  subheadline:
    "Find out how many conversions your current tracking is missing—and how much revenue is going unattributed.",
  ctaText: "Find Your Gap",
};

const inputs = ref<AttributionGapInputs>({
  monthlyMailersSent: 5000,
  trackedConversions: 50,
  totalNewCustomers: 200,
  averageRevenuePerCustomer: 350,
});

const hasCalculated = ref(false);

const results = computed<AttributionGapResults>(() => {
  const {
    monthlyMailersSent,
    trackedConversions,
    totalNewCustomers,
    averageRevenuePerCustomer,
  } = inputs.value;

  const safeTotal = Math.max(totalNewCustomers, 1);
  const safeMailers = Math.max(monthlyMailersSent, 1);

  const trackingCaptureRate = (trackedConversions / safeTotal) * 100;
  const untrackedConversions = Math.max(totalNewCustomers - trackedConversions, 0);
  const attributionGapPercentage = (untrackedConversions / safeTotal) * 100;

  const attributedRevenue = trackedConversions * averageRevenuePerCustomer;
  const unattributedRevenue = untrackedConversions * averageRevenuePerCustomer;
  const totalActualRevenue = totalNewCustomers * averageRevenuePerCustomer;

  const conversionRate = (totalNewCustomers / safeMailers) * 100;
  const revenuePerMailer = totalActualRevenue / safeMailers;

  return {
    trackingCaptureRate,
    untrackedConversions,
    attributionGapPercentage,
    unattributedRevenue,
    attributedRevenue,
    totalActualRevenue,
    conversionRate,
    revenuePerMailer,
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

const faqContent: IndustryFAQContent = {
  heading: "Attribution Gap FAQ",
  faqs: [
    {
      question: "What is the attribution gap?",
      answer:
        "The attribution gap is the difference between the conversions you can track (via QR codes, promo codes, call tracking) and the conversions that actually came from your direct mail. Most tracking methods only capture 10-30% of mail-driven customers.",
    },
    {
      question: "How do I know how many customers came from mailed areas?",
      answer:
        "Look at your CRM or job management system. Count new customers whose addresses are in the neighborhoods/zip codes where you mailed. Even without perfect tracking, this gives you a baseline for comparison with your tracked conversions.",
    },
    {
      question: "Why is my tracking capture rate so low?",
      answer:
        "Customers who receive your mailer rarely use the QR code or promo code. They Google your company name, call the number directly, visit your website, or walk in. Your tracking only captures those who specifically use your tracking mechanism—a small fraction of total responders.",
    },
    {
      question: "How does PostCanary close the attribution gap?",
      answer:
        "PostCanary matches your mailed addresses directly against your customer/job data using deterministic address matching. If a customer's address was on your mail list and they became a customer, PostCanary connects them—regardless of how they found you.",
    },
    {
      question: "What's a typical attribution gap?",
      answer:
        "Most businesses using QR codes and promo codes see a 70-90% attribution gap—meaning they can only attribute 10-30% of their mail-driven customers. PostCanary customers typically achieve 95%+ attribution accuracy.",
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
            <div class="bg-gradient-to-r from-[var(--pc-navy)] to-[var(--pc-navy-2)] p-6 sm:p-8">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--pc-cyan)]/10">
                  <PieChart class="h-6 w-6 text-[var(--pc-cyan)]" />
                </div>
                <div>
                  <h2 class="text-xl sm:text-2xl font-bold text-[var(--pc-text)]">
                    Find Your Attribution Gap
                  </h2>
                  <p class="text-[var(--pc-text-soft)] text-sm mt-1">
                    Compare tracked vs. actual conversions
                  </p>
                </div>
              </div>
            </div>

            <!-- Calculator Form -->
            <div class="p-6 sm:p-8">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-[var(--pc-text)] mb-2" for="mailers">
                    Monthly Mailers Sent
                  </label>
                  <input
                    id="mailers"
                    v-model.number="inputs.monthlyMailersSent"
                    type="number"
                    min="100"
                    max="100000"
                    class="w-full rounded-lg border border-[var(--pc-border)] bg-[var(--pc-navy)] px-4 py-3 text-[var(--pc-text)] focus:border-[var(--pc-cyan)] focus:ring-2 focus:ring-[var(--pc-cyan)]/20 outline-none transition-colors"
                  />
                  <p class="text-xs text-[var(--pc-text-soft)] mt-1">Total pieces mailed per month</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--pc-text)] mb-2" for="tracked">
                    Tracked Conversions (QR/Promo Codes)
                  </label>
                  <input
                    id="tracked"
                    v-model.number="inputs.trackedConversions"
                    type="number"
                    min="0"
                    max="10000"
                    class="w-full rounded-lg border border-[var(--pc-border)] bg-[var(--pc-navy)] px-4 py-3 text-[var(--pc-text)] focus:border-[var(--pc-cyan)] focus:ring-2 focus:ring-[var(--pc-cyan)]/20 outline-none transition-colors"
                  />
                  <p class="text-xs text-[var(--pc-text-soft)] mt-1">Customers who used your tracking code</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--pc-text)] mb-2" for="total">
                    Total New Customers from Mailed Areas
                  </label>
                  <input
                    id="total"
                    v-model.number="inputs.totalNewCustomers"
                    type="number"
                    min="0"
                    max="50000"
                    class="w-full rounded-lg border border-[var(--pc-border)] bg-[var(--pc-navy)] px-4 py-3 text-[var(--pc-text)] focus:border-[var(--pc-cyan)] focus:ring-2 focus:ring-[var(--pc-cyan)]/20 outline-none transition-colors"
                  />
                  <p class="text-xs text-[var(--pc-text-soft)] mt-1">All customers in your mailed zip codes/neighborhoods</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--pc-text)] mb-2" for="revenue">
                    Average Revenue Per Customer
                  </label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pc-text-soft)]">$</span>
                    <input
                      id="revenue"
                      v-model.number="inputs.averageRevenuePerCustomer"
                      type="number"
                      min="50"
                      max="100000"
                      class="w-full rounded-lg border border-[var(--pc-border)] bg-[var(--pc-navy)] pl-8 pr-4 py-3 text-[var(--pc-text)] focus:border-[var(--pc-cyan)] focus:ring-2 focus:ring-[var(--pc-cyan)]/20 outline-none transition-colors"
                    />
                  </div>
                  <p class="text-xs text-[var(--pc-text-soft)] mt-1">Average ticket or job value</p>
                </div>
              </div>

              <div class="mt-8 flex justify-center">
                <button
                  @click="calculate"
                  class="inline-flex items-center gap-2 rounded-lg bg-[var(--pc-yellow)] px-8 py-4 text-lg font-semibold text-[var(--pc-navy)] shadow-md hover:opacity-90 cursor-pointer transition-colors"
                >
                  <Calculator class="h-5 w-5" />
                  Calculate My Gap
                </button>
              </div>
            </div>
          </div>

          <!-- Results Section -->
          <div v-if="hasCalculated" class="mt-12 space-y-8 animate-fade-in">
            <!-- Key Insight Banner -->
            <div class="bg-gradient-to-r from-rose-900/40 to-red-900/40 border border-rose-500/30 rounded-[14px] p-6 sm:p-8">
              <div class="flex items-start gap-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-500/20">
                  <AlertCircle class="h-6 w-6 text-rose-400" />
                </div>
                <div>
                  <h3 class="text-xl font-bold text-rose-300">
                    {{ formatPercent(results.attributionGapPercentage) }} of Your Mail-Driven Revenue Is Invisible
                  </h3>
                  <p class="text-rose-200/80 mt-2">
                    You're only attributing {{ formatPercent(results.trackingCaptureRate) }} of your conversions. That's {{ formatCurrency(results.unattributedRevenue) }}/month in revenue you can't connect to your mail campaigns.
                  </p>
                </div>
              </div>
            </div>

            <!-- Donut Chart Visualization -->
            <div class="bg-[var(--pc-card)] rounded-[14px] shadow-[0_18px_45px_rgba(0,0,0,0.35)] border border-[var(--pc-border)] p-6 sm:p-8">
              <h3 class="text-xl font-bold text-[var(--pc-text)] mb-6 flex items-center gap-2">
                <PieChart class="h-6 w-6 text-[var(--pc-cyan)]" />
                Attribution Breakdown
              </h3>

              <div class="flex flex-col lg:flex-row items-center justify-center gap-12">
                <div class="relative">
                  <svg width="240" height="240" viewBox="0 0 240 240" class="transform -rotate-90">
                    <circle cx="120" cy="120" r="90" fill="none" stroke="var(--pc-border)" stroke-width="30" />
                    <circle
                      cx="120" cy="120" r="90" fill="none"
                      stroke="var(--pc-cyan)" stroke-width="30"
                      :stroke-dasharray="`${(results.trackingCaptureRate / 100) * 565.48} 565.48`"
                    />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-4xl font-bold text-[var(--pc-text)]">{{ formatPercent(results.attributionGapPercentage) }}</span>
                    <span class="text-sm text-[var(--pc-text-soft)]">Untracked</span>
                  </div>
                </div>

                <div class="space-y-4">
                  <div class="flex items-center gap-4">
                    <div class="w-5 h-5 rounded bg-[var(--pc-cyan)]"></div>
                    <div>
                      <div class="font-semibold text-[var(--pc-text)]">Tracked Conversions</div>
                      <div class="text-sm text-[var(--pc-text-muted)]">
                        {{ formatNumber(inputs.trackedConversions) }} customers ({{ formatPercent(results.trackingCaptureRate) }})
                      </div>
                      <div class="text-sm font-medium text-[var(--pc-cyan)]">{{ formatCurrency(results.attributedRevenue) }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <div class="w-5 h-5 rounded bg-[var(--pc-border)]"></div>
                    <div>
                      <div class="font-semibold text-[var(--pc-text)]">Untracked Conversions</div>
                      <div class="text-sm text-[var(--pc-text-muted)]">
                        {{ formatNumber(results.untrackedConversions) }} customers ({{ formatPercent(results.attributionGapPercentage) }})
                      </div>
                      <div class="text-sm font-medium text-rose-400">{{ formatCurrency(results.unattributedRevenue) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Metrics Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="bg-[var(--pc-card)] rounded-xl p-6 border border-[var(--pc-cyan)]/30">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-[var(--pc-text-muted)]">Total Revenue</div>
                  <DollarSign class="w-5 h-5 text-[var(--pc-cyan)]" />
                </div>
                <div class="text-2xl font-bold text-[var(--pc-text)]">{{ formatCurrency(results.totalActualRevenue) }}</div>
                <div class="text-xs text-[var(--pc-text-soft)] mt-1">per month</div>
              </div>

              <div class="bg-[var(--pc-card)] rounded-xl p-6 border border-rose-500/30">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-rose-400">Unattributed</div>
                  <AlertCircle class="w-5 h-5 text-rose-400" />
                </div>
                <div class="text-2xl font-bold text-rose-300">{{ formatCurrency(results.unattributedRevenue) }}</div>
                <div class="text-xs text-rose-400/70 mt-1">revenue invisible</div>
              </div>

              <div class="bg-[var(--pc-card)] rounded-xl p-6 border border-purple-500/30">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-purple-400">True Conversion Rate</div>
                  <Users class="w-5 h-5 text-purple-400" />
                </div>
                <div class="text-2xl font-bold text-purple-300">{{ formatPercent(results.conversionRate) }}</div>
                <div class="text-xs text-purple-400/70 mt-1">of mailers convert</div>
              </div>

              <div class="bg-[var(--pc-card)] rounded-xl p-6 border border-emerald-500/30">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-emerald-400">Revenue Per Mailer</div>
                  <TrendingUp class="w-5 h-5 text-emerald-400" />
                </div>
                <div class="text-2xl font-bold text-emerald-300">${{ results.revenuePerMailer.toFixed(2) }}</div>
                <div class="text-xs text-emerald-400/70 mt-1">actual return per piece</div>
              </div>
            </div>

            <!-- The Problem Explained -->
            <div class="bg-[var(--pc-navy)] rounded-[14px] border border-[var(--pc-border)] p-6 sm:p-8">
              <h3 class="text-lg font-bold text-[var(--pc-text)] mb-4">Why Traditional Tracking Fails</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="flex items-start gap-3">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pc-border)] text-[var(--pc-text-muted)] font-bold text-sm">1</div>
                  <div>
                    <div class="font-medium text-[var(--pc-text)]">Customer Sees Mailer</div>
                    <p class="text-sm text-[var(--pc-text-muted)] mt-1">They're interested but don't scan the QR code</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pc-border)] text-[var(--pc-text-muted)] font-bold text-sm">2</div>
                  <div>
                    <div class="font-medium text-[var(--pc-text)]">They Google Your Name</div>
                    <p class="text-sm text-[var(--pc-text-muted)] mt-1">Or call directly, or visit your website</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 font-bold text-sm">?</div>
                  <div>
                    <div class="font-medium text-[var(--pc-text)]">Attribution Lost</div>
                    <p class="text-sm text-[var(--pc-text-muted)] mt-1">No way to connect this customer to your mailer</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- CTA Section -->
            <div class="bg-gradient-to-r from-[var(--pc-navy)] to-[var(--pc-navy-2)] rounded-[14px] border border-[var(--pc-cyan)]/20 p-8 sm:p-10 text-center">
              <h3 class="text-2xl sm:text-3xl font-bold text-[var(--pc-text)] mb-4">
                Close the Gap with PostCanary
              </h3>
              <p class="text-[var(--pc-text-muted)] max-w-2xl mx-auto mb-8">
                PostCanary uses deterministic address matching to connect every customer to the mailer they received. No more guessing—see your actual attribution in minutes.
              </p>
              <button
                @click="onGetStarted"
                class="inline-flex items-center gap-2 rounded-lg bg-[var(--pc-yellow)] px-8 py-4 text-lg font-semibold text-[var(--pc-navy)] shadow-md hover:opacity-90 cursor-pointer transition-colors"
              >
                <Target class="h-5 w-5" />
                Get Started Free
              </button>
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
