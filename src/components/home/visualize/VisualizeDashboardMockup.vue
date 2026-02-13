<!-- src/components/home/visualize/VisualizeDashboardMockup.vue -->
<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";

const props = defineProps<{ active: boolean }>();

/* ── KPI config ─────────────────────────────────────────── */
interface KpiCard {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  sub?: string;
  border: string;
}

const kpis: KpiCard[] = [
  { label: "Total Mail Sent", value: 24180, border: "var(--pc-cyan)" },
  { label: "Unique Addresses", value: 22641, border: "var(--pc-yellow)" },
  { label: "CRM Conversions", value: 1847, border: "var(--pc-cyan)" },
  { label: "Match Rate", value: 7.6, suffix: "%", decimals: 1, border: "var(--pc-yellow)" },
  {
    label: "Match Revenue",
    value: 148290,
    prefix: "$",
    sub: "$6.13 per mailer",
    border: "var(--pc-cyan)",
  },
  {
    label: "Avg Ticket",
    value: 80.23,
    prefix: "$",
    decimals: 2,
    sub: "19 days to convert",
    border: "var(--pc-yellow)",
  },
];

const summaryStats = [
  { label: "ROI", value: "4.2x" },
  { label: "CPA", value: "$14.70" },
  { label: "30-Day Conv", value: "68%" },
];

/* ── Animation state ────────────────────────────────────── */
const hasAnimated = ref(false);
const bannerVisible = ref(false);
const kpiVisible = ref<boolean[]>(new Array(6).fill(false));
const kpiDisplayValues = ref<number[]>(new Array(6).fill(0));
const summaryVisible = ref(false);

let animFrame: number | null = null;
let timeouts: ReturnType<typeof setTimeout>[] = [];
let unmounted = false;

function clearTimers() {
  timeouts.forEach(clearTimeout);
  timeouts = [];
  if (animFrame) cancelAnimationFrame(animFrame);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => {
    const id = setTimeout(r, ms);
    timeouts.push(id);
  });
}

function fmt(val: number | undefined, decimals = 0): string {
  return (val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function countUp(index: number, target: number, durationMs: number) {
  const start = performance.now();
  const tick = (now: number) => {
    if (unmounted) return;
    const elapsed = now - start;
    const t = Math.min(elapsed / durationMs, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    kpiDisplayValues.value[index] = eased * target;
    if (t < 1) {
      animFrame = requestAnimationFrame(tick);
    } else {
      kpiDisplayValues.value[index] = target;
    }
  };
  animFrame = requestAnimationFrame(tick);
}

async function runEntrance() {
  if (unmounted || hasAnimated.value) return;
  hasAnimated.value = true;

  // Banner
  await delay(200);
  bannerVisible.value = true;

  // KPI cards stagger
  await delay(400);
  for (let i = 0; i < 6; i++) {
    if (unmounted) return;
    await delay(150);
    kpiVisible.value[i] = true;
    countUp(i, kpis[i]!.value, 1000);
  }

  // Summary row
  await delay(1200);
  if (unmounted) return;
  summaryVisible.value = true;
}

watch(
  () => props.active,
  (val) => {
    if (val && !hasAnimated.value) runEntrance();
  },
  { immediate: true },
);

onUnmounted(() => {
  unmounted = true;
  clearTimers();
});
</script>

<template>
  <div class="w-full">
    <!-- Results Banner -->
    <div
      class="rounded-xl border border-[var(--pc-border)] px-4 sm:px-5 py-3 flex items-center justify-between transition-all duration-500"
      :class="bannerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'"
      style="background: linear-gradient(135deg, var(--pc-navy-2), var(--pc-card))"
    >
      <div class="flex items-center gap-2">
        <svg
          class="h-5 w-5 text-[var(--pc-cyan)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span class="text-sm sm:text-base font-bold text-[var(--pc-text)]"
          >Campaign Analysis Complete</span
        >
      </div>
      <span class="text-xs sm:text-sm text-[var(--pc-yellow)] font-medium"
        >24,180 mailers analyzed</span
      >
    </div>

    <!-- KPI Cards -->
    <div class="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
      <div
        v-for="(kpi, i) in kpis"
        :key="kpi.label"
        class="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-card)] p-3 sm:p-4 transition-all duration-500"
        :class="
          kpiVisible[i]
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
        "
        :style="{ borderLeft: '3px solid ' + kpi.border }"
      >
        <p
          class="text-[10px] sm:text-xs font-medium text-[var(--pc-text-soft)] uppercase tracking-wide mb-1"
        >
          {{ kpi.label }}
        </p>
        <p
          class="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--pc-text)] leading-tight"
        >
          {{ kpi.prefix || "" }}{{ fmt(kpiDisplayValues[i], kpi.decimals ?? 0)
          }}{{ kpi.suffix || "" }}
        </p>
        <p
          v-if="kpi.sub"
          class="text-[10px] sm:text-xs text-[var(--pc-text-muted)] mt-0.5"
        >
          {{ kpi.sub }}
        </p>
      </div>
    </div>

    <!-- Summary Stats Row -->
    <div
      class="mt-3 sm:mt-4 flex items-center justify-center gap-3 sm:gap-6 transition-all duration-500"
      :class="
        summaryVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-3'
      "
    >
      <div
        v-for="stat in summaryStats"
        :key="stat.label"
        class="flex items-center gap-2 rounded-lg border border-[var(--pc-border)] bg-[var(--pc-card)] px-3 sm:px-4 py-2"
      >
        <span class="text-xs text-[var(--pc-text-soft)]">{{ stat.label }}</span>
        <span class="text-sm sm:text-base font-bold text-[var(--pc-cyan)]">{{
          stat.value
        }}</span>
      </div>
    </div>
  </div>
</template>
