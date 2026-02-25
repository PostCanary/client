<!-- src/components/home/PricingCalculator.vue -->
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { PlanCode } from "@/api/billing";

const emit = defineEmits<{
  recommendations: [
    { ongoingPlanId: PlanCode | null; fastStartPlanId: PlanCode | null },
  ];
}>();

/* ── Slider stops ─────────────────────────────────────────── */
const volumeStops = [
  100, 250, 500, 750, 1_000, 1_500, 2_000, 2_500, 3_000, 3_500, 4_000,
  4_500, 5_000, 6_000, 7_000, 8_000, 9_000, 10_000, 12_500, 15_000,
  17_500, 20_000, 22_500, 25_000, 30_000, 40_000, 50_000, 75_000, 100_000,
];

const defaultVolumeIndex = volumeStops.indexOf(5_000); // 12
const volumeIndex = ref(defaultVolumeIndex);
const monthsBackData = ref(0);

const monthlyVolume = computed(() => volumeStops[volumeIndex.value]!);

/* ── Formatting ───────────────────────────────────────────── */
function fmtVolume(v: number): string {
  if (v >= 100_000) return "100,000+";
  return v.toLocaleString("en-US");
}

/* ── Plan recommendation ──────────────────────────────────── */
type PlanInfo = {
  id: PlanCode;
  name: string;
  price: string;
  limit: number;
  limitLabel: string;
};

const plans: PlanInfo[] = [
  {
    id: "INSIGHT",
    name: "Tier 1",
    price: "$99/mo",
    limit: 1_000,
    limitLabel: "Up to 1,000 mailers/mo",
  },
  {
    id: "PERFORMANCE",
    name: "Tier 2",
    price: "$249/mo",
    limit: 5_000,
    limitLabel: "Up to 5,000 mailers/mo",
  },
  {
    id: "PRECISION",
    name: "Tier 3",
    price: "$499/mo",
    limit: 25_000,
    limitLabel: "Up to 25,000 mailers/mo",
  },
  {
    id: "ELITE",
    name: "Tier 4",
    price: "$999/mo",
    limit: Infinity,
    limitLabel: "Unlimited mailers",
  },
];

function recommendPlan(volume: number): PlanInfo {
  for (const plan of plans) {
    if (volume <= plan.limit) return plan;
  }
  return plans[plans.length - 1]!; // fallback to ELITE
}

/* ── Computed results ─────────────────────────────────────── */
const backDataUpload = computed(() => monthlyVolume.value * monthsBackData.value);
const firstMonthTotal = computed(
  () => monthlyVolume.value * (monthsBackData.value + 1),
);

const ongoingPlan = computed(() => recommendPlan(monthlyVolume.value));
const fastStartPlan = computed(() => recommendPlan(firstMonthTotal.value));

const showFastStart = computed(
  () =>
    monthsBackData.value > 0 &&
    fastStartPlan.value.id !== ongoingPlan.value.id,
);

/* ── Slider fill percentage ───────────────────────────────── */
const volumeFillPct = computed(
  () => (volumeIndex.value / (volumeStops.length - 1)) * 100,
);
const monthsFillPct = computed(() => (monthsBackData.value / 24) * 100);

/* ── Emit recommendations ─────────────────────────────────── */
const recommendations = computed(() => ({
  ongoingPlanId: ongoingPlan.value.id,
  fastStartPlanId:
    monthsBackData.value > 0 ? fastStartPlan.value.id : null,
}));

watch(
  recommendations,
  (val) => {
    emit("recommendations", val);
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div
    class="w-full max-w-3xl mx-auto rounded-[14px] border border-[var(--pc-border)] bg-[var(--pc-card)] px-5 sm:px-8 py-6 sm:py-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
  >
    <h3
      class="text-[16px] sm:text-[18px] font-bold tracking-[0.02em] text-[var(--pc-text)] text-center mb-6 sm:mb-8"
    >
      Find Your Plan
    </h3>

    <!-- Monthly volume slider -->
    <div class="mb-6">
      <div class="flex items-baseline justify-between mb-2">
        <label
          class="text-[13px] sm:text-[15px] font-semibold text-[var(--pc-text-muted)]"
        >
          Monthly Mail Volume
        </label>
        <span
          class="text-[15px] sm:text-[18px] font-bold text-[var(--pc-cyan)] tabular-nums"
        >
          {{ fmtVolume(monthlyVolume) }}
        </span>
      </div>
      <input
        type="range"
        :min="0"
        :max="volumeStops.length - 1"
        :step="1"
        v-model.number="volumeIndex"
        class="calc-slider w-full"
        :style="{ '--fill-pct': volumeFillPct + '%' }"
        aria-label="Monthly mail volume"
      />
      <div
        class="flex justify-between mt-1 text-[11px] text-[var(--pc-text-soft)]"
      >
        <span>100</span>
        <span>100K+</span>
      </div>
    </div>

    <!-- Months of historical data slider -->
    <div class="mb-6 sm:mb-8">
      <div class="flex items-baseline justify-between mb-2">
        <label
          class="text-[13px] sm:text-[15px] font-semibold text-[var(--pc-text-muted)]"
        >
          Months of Historical Data
        </label>
        <span
          class="text-[15px] sm:text-[18px] font-bold text-[var(--pc-cyan)] tabular-nums"
        >
          {{ monthsBackData }}
          {{ monthsBackData === 1 ? "month" : "months" }}
        </span>
      </div>
      <input
        type="range"
        :min="0"
        :max="24"
        :step="1"
        v-model.number="monthsBackData"
        class="calc-slider w-full"
        :style="{ '--fill-pct': monthsFillPct + '%' }"
        aria-label="Months of historical data"
      />
      <div
        class="flex justify-between mt-1 text-[11px] text-[var(--pc-text-soft)]"
      >
        <span>0</span>
        <span>24</span>
      </div>
    </div>

    <!-- Results area -->
    <div
      class="rounded-[10px] bg-[var(--pc-navy)] px-5 sm:px-6 py-5 sm:py-6"
    >
      <div
        class="grid gap-5 sm:gap-6"
        :class="showFastStart ? 'sm:grid-cols-2' : 'grid-cols-1'"
      >
        <!-- Ongoing plan result -->
        <Transition name="result-swap" mode="out-in">
          <div :key="ongoingPlan.id">
            <p
              class="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--pc-text-soft)] mb-2"
            >
              Ongoing Plan
            </p>
            <p
              class="text-[20px] sm:text-[24px] font-bold text-[var(--pc-text)] leading-tight"
            >
              {{ ongoingPlan.name }}
            </p>
            <p
              class="text-[16px] sm:text-[18px] font-semibold text-[var(--pc-cyan)] mt-1"
            >
              {{ ongoingPlan.price }}
            </p>
            <p class="text-[12px] sm:text-[13px] text-[var(--pc-text-muted)] mt-1">
              {{ ongoingPlan.limitLabel }}
            </p>
          </div>
        </Transition>

        <!-- Fast start result -->
        <Transition name="fast-start">
          <div
            v-if="showFastStart"
            :key="fastStartPlan.id + '-fs'"
          >
            <p
              class="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--pc-text-soft)] mb-2"
            >
              Fast Start Plan
            </p>
            <p
              class="text-[20px] sm:text-[24px] font-bold text-[var(--pc-text)] leading-tight"
            >
              {{ fastStartPlan.name }}
            </p>
            <p
              class="text-[16px] sm:text-[18px] font-semibold text-[var(--pc-yellow)] mt-1"
            >
              {{ fastStartPlan.price }}
            </p>
            <p class="text-[12px] sm:text-[13px] text-[var(--pc-text-muted)] mt-1">
              {{ fmtVolume(firstMonthTotal) }} mailers in month 1
            </p>
            <p
              class="text-[11px] sm:text-[12px] text-[var(--pc-cyan)] mt-2 font-medium"
            >
              Downgrade to {{ ongoingPlan.name }} after month 1
            </p>
          </div>
        </Transition>
      </div>

      <!-- Back data summary (when applicable) -->
      <Transition name="result-swap" mode="out-in">
        <p
          v-if="monthsBackData > 0"
          :key="backDataUpload"
          class="mt-4 pt-4 border-t border-[var(--pc-border)] text-[11px] sm:text-[12px] text-[var(--pc-text-soft)]"
        >
          Back data upload: {{ fmtVolume(backDataUpload) }} mailers ({{
            monthsBackData
          }}
          {{ monthsBackData === 1 ? "month" : "months" }} &times;
          {{ fmtVolume(monthlyVolume) }}/mo)
        </p>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* ── Slider base ──────────────────────────────────────────── */
.calc-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 999px;
  outline: none;
  cursor: pointer;
  background: linear-gradient(
    to right,
    var(--pc-cyan) 0%,
    var(--pc-cyan) var(--fill-pct, 0%),
    var(--pc-border) var(--fill-pct, 0%),
    var(--pc-border) 100%
  );
}

/* ── Webkit thumb ─────────────────────────────────────────── */
.calc-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--pc-cyan);
  border: 2px solid var(--pc-navy);
  box-shadow: 0 0 0 0 rgba(0, 255, 255, 0);
  transition: box-shadow 0.2s ease;
  cursor: pointer;
}

.calc-slider:hover::-webkit-slider-thumb,
.calc-slider:focus::-webkit-slider-thumb {
  box-shadow: 0 0 10px 3px rgba(0, 255, 255, 0.35);
}

/* ── Firefox thumb ────────────────────────────────────────── */
.calc-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--pc-cyan);
  border: 2px solid var(--pc-navy);
  box-shadow: 0 0 0 0 rgba(0, 255, 255, 0);
  transition: box-shadow 0.2s ease;
  cursor: pointer;
}

.calc-slider:hover::-moz-range-thumb,
.calc-slider:focus::-moz-range-thumb {
  box-shadow: 0 0 10px 3px rgba(0, 255, 255, 0.35);
}

/* Firefox track (needed for filled gradient) */
.calc-slider::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: var(--pc-border);
}

.calc-slider::-moz-range-progress {
  height: 6px;
  border-radius: 999px;
  background: var(--pc-cyan);
}

/* ── Result swap transition ───────────────────────────────── */
.result-swap-enter-active,
.result-swap-leave-active {
  transition: all 0.25s ease;
}

.result-swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.result-swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── Fast start slide-in ──────────────────────────────────── */
.fast-start-enter-active {
  transition: all 0.35s ease;
}

.fast-start-leave-active {
  transition: all 0.25s ease;
}

.fast-start-enter-from {
  opacity: 0;
  transform: translateX(16px);
}

.fast-start-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
