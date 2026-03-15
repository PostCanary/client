<!-- src/components/home/visualize/VisualizeDemoMockup.vue -->
<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";

const props = defineProps<{ active: boolean }>();

const hasAnimated = ref(false);
const visibleSections = ref<boolean[]>([false, false, false]);
let timeouts: ReturnType<typeof setTimeout>[] = [];

function clearTimers() {
  timeouts.forEach(clearTimeout);
  timeouts = [];
}

function runAnimation() {
  if (hasAnimated.value) return;
  hasAnimated.value = true;
  visibleSections.value.forEach((_, i) => {
    timeouts.push(
      setTimeout(() => {
        visibleSections.value[i] = true;
      }, 200 + i * 300),
    );
  });
}

watch(
  () => props.active,
  (val) => {
    if (val) runAnimation();
  },
  { immediate: true },
);

onUnmounted(() => clearTimers());

const heroStats = [
  { label: "Matched Customers", value: "1,847", sub: "from 24,180 mailers" },
  { label: "Avg. Household Income", value: "$78,400", sub: "matched households" },
  { label: "Confidence Score", value: "High", sub: "based on 1,847 matches" },
];

const ageData = [
  { label: "18–24", pct: 8 },
  { label: "25–34", pct: 22 },
  { label: "35–44", pct: 31 },
  { label: "45–54", pct: 24 },
  { label: "55–64", pct: 11 },
  { label: "65+", pct: 4 },
];

const incomeData = [
  { label: "< $50K", pct: 12, color: "var(--mkt-text-soft)" },
  { label: "$50–75K", pct: 28, color: "var(--mkt-yellow)" },
  { label: "$75–100K", pct: 35, color: "var(--mkt-teal)" },
  { label: "$100K+", pct: 25, color: "var(--mkt-navy)" },
];

const maxPct = Math.max(...ageData.map((d) => d.pct));
</script>

<template>
  <div class="space-y-4">
    <!-- Hero Stats -->
    <div
      class="grid grid-cols-3 gap-3 transition-all duration-500"
      :class="visibleSections[0] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'"
    >
      <div
        v-for="stat in heroStats"
        :key="stat.label"
        class="rounded-xl border border-[var(--mkt-border)] bg-[var(--mkt-bg)] p-3 sm:p-4"
      >
        <p class="text-[10px] sm:text-[11px] font-medium text-[var(--mkt-text-soft)] uppercase tracking-wide mb-1">
          {{ stat.label }}
        </p>
        <p class="text-[18px] sm:text-[22px] font-bold text-[var(--mkt-text)] leading-tight">
          {{ stat.value }}
        </p>
        <p class="text-[10px] sm:text-[11px] text-[var(--mkt-text-muted)] mt-0.5">
          {{ stat.sub }}
        </p>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid gap-3 sm:gap-4 md:grid-cols-2">
      <!-- Age Distribution Bar Chart -->
      <div
        class="rounded-xl border border-[var(--mkt-border)] bg-[var(--mkt-bg)] p-4 transition-all duration-500"
        :class="visibleSections[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'"
      >
        <h4 class="text-[13px] sm:text-[14px] font-semibold text-[var(--mkt-text)] mb-4">
          Age Distribution
        </h4>
        <div class="space-y-2.5">
          <div v-for="bar in ageData" :key="bar.label" class="flex items-center gap-3">
            <span class="text-[11px] sm:text-[12px] text-[var(--mkt-text-muted)] w-10 shrink-0 text-right">
              {{ bar.label }}
            </span>
            <div class="flex-1 h-5 bg-[var(--mkt-border)]/50 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full bg-[var(--mkt-teal)] transition-all duration-700"
                :style="{
                  width: visibleSections[1] ? `${(bar.pct / maxPct) * 100}%` : '0%',
                }"
              />
            </div>
            <span class="text-[11px] sm:text-[12px] font-semibold text-[var(--mkt-text)] w-8 shrink-0">
              {{ bar.pct }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Income Breakdown Donut -->
      <div
        class="rounded-xl border border-[var(--mkt-border)] bg-[var(--mkt-bg)] p-4 transition-all duration-500"
        :class="visibleSections[2] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'"
      >
        <h4 class="text-[13px] sm:text-[14px] font-semibold text-[var(--mkt-text)] mb-4">
          Household Income
        </h4>
        <div class="flex items-center gap-6">
          <!-- Simple donut via SVG -->
          <svg viewBox="0 0 100 100" class="w-24 h-24 sm:w-28 sm:h-28 shrink-0 -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--mkt-border)" stroke-width="16" />
            <!-- Segments -->
            <circle
              v-for="(seg, i) in incomeData"
              :key="seg.label"
              cx="50" cy="50" r="40" fill="none"
              :stroke="seg.color"
              stroke-width="16"
              :stroke-dasharray="`${seg.pct * 2.51} ${251.2 - seg.pct * 2.51}`"
              :stroke-dashoffset="`${-incomeData.slice(0, i).reduce((s, d) => s + d.pct * 2.51, 0)}`"
              class="transition-all duration-700"
              :style="{ opacity: visibleSections[2] ? 1 : 0 }"
            />
          </svg>
          <!-- Legend -->
          <div class="space-y-2">
            <div
              v-for="seg in incomeData"
              :key="seg.label"
              class="flex items-center gap-2"
            >
              <span
                class="w-2.5 h-2.5 rounded-full shrink-0"
                :style="{ background: seg.color }"
              />
              <span class="text-[11px] sm:text-[12px] text-[var(--mkt-text-muted)]">
                {{ seg.label }}
              </span>
              <span class="text-[11px] sm:text-[12px] font-semibold text-[var(--mkt-text)] ml-auto">
                {{ seg.pct }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
