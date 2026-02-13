<!-- src/components/home/visualize/VisualizeTrendMockup.vue -->
<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";

const props = defineProps<{ active: boolean }>();

/* ── Chart config ────────────────────────────────────────── */
const CV = { w: 800, h: 300, pl: 45, pr: 15, pt: 20, pb: 40, maxY: 100 } as const;
const cW = CV.w - CV.pl - CV.pr;
const cH = CV.h - CV.pt - CV.pb;

const chartMonths = [
  "JAN '25", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const chartSeries = [
  {
    name: "Mail Volume",
    color: "var(--pc-text)",
    data: [45, 52, 58, 63, 71, 68, 74, 82, 78, 85, 90, 88],
  },
  {
    name: "CRM Jobs",
    color: "var(--pc-cyan)",
    data: [18, 22, 28, 31, 35, 33, 38, 42, 40, 44, 48, 46],
  },
  {
    name: "Matches",
    color: "var(--pc-yellow)",
    data: [4, 6, 8, 10, 12, 11, 14, 16, 15, 18, 20, 19],
  },
];

function toX(i: number): number {
  return CV.pl + (i / (chartMonths.length - 1)) * cW;
}
function toY(val: number): number {
  return CV.pt + cH - (val / CV.maxY) * cH;
}

function seriesPath(data: number[]): string {
  return data
    .map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(" ");
}

function seriesPoints(data: number[]): { x: number; y: number }[] {
  return data.map((v, i) => ({ x: toX(i), y: toY(v) }));
}

/** Gradient fill area path (closes below the line back to baseline) */
function areaPath(data: number[]): string {
  const linePart = seriesPath(data);
  const lastX = toX(data.length - 1);
  const firstX = toX(0);
  const baseY = toY(0);
  return `${linePart} L${lastX.toFixed(1)},${baseY.toFixed(1)} L${firstX.toFixed(1)},${baseY.toFixed(1)} Z`;
}

const gridLines = [0, 25, 50, 75, 100].map((v) => ({ y: toY(v), label: String(v) }));

const xAxisLabels = chartMonths.map((label, i) => ({ x: toX(i), label, i }));

/* ── Animation state ────────────────────────────────────── */
const hasAnimated = ref(false);
const chartDrawn = ref(false);
const calloutVisible = ref(false);

let timeouts: ReturnType<typeof setTimeout>[] = [];
let unmounted = false;

function clearTimers() {
  timeouts.forEach(clearTimeout);
  timeouts = [];
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => {
    const id = setTimeout(r, ms);
    timeouts.push(id);
  });
}

async function runEntrance() {
  if (unmounted || hasAnimated.value) return;
  hasAnimated.value = true;

  await delay(300);
  if (unmounted) return;
  chartDrawn.value = true;

  await delay(2800);
  if (unmounted) return;
  calloutVisible.value = true;
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
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm sm:text-base font-semibold text-[var(--pc-text)]"
        >Monthly Performance</span
      >
      <div class="flex items-center gap-3 sm:gap-4">
        <div
          v-for="series in chartSeries"
          :key="series.name"
          class="flex items-center gap-1.5"
        >
          <span
            class="inline-block h-2.5 w-2.5 rounded-full"
            :style="{ backgroundColor: series.color }"
          />
          <span class="text-[10px] sm:text-xs text-[var(--pc-text-muted)]">{{
            series.name
          }}</span>
        </div>
      </div>
    </div>

    <!-- SVG Chart -->
    <svg
      :viewBox="`0 0 ${CV.w} ${CV.h}`"
      class="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="var(--pc-text)" stop-opacity="0.08" />
          <stop offset="100%" stop-color="var(--pc-text)" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Grid lines -->
      <line
        v-for="gl in gridLines"
        :key="'g-' + gl.label"
        :x1="CV.pl"
        :x2="CV.w - CV.pr"
        :y1="gl.y"
        :y2="gl.y"
        stroke="var(--pc-border)"
        stroke-width="0.5"
      />

      <!-- Y-axis labels -->
      <text
        v-for="gl in gridLines"
        :key="'yl-' + gl.label"
        :x="CV.pl - 8"
        :y="gl.y"
        text-anchor="end"
        dominant-baseline="central"
        fill="var(--pc-text-soft)"
        font-size="10"
        class="chart-text"
      >
        {{ gl.label }}
      </text>

      <!-- X-axis labels -->
      <text
        v-for="xl in xAxisLabels"
        :key="'xl-' + xl.i"
        :x="xl.x"
        :y="CV.h - 10"
        text-anchor="middle"
        fill="var(--pc-text-soft)"
        font-size="9"
        class="chart-text"
      >
        {{ xl.label }}
      </text>

      <!-- Gradient fill under first series -->
      <path
        :d="areaPath(chartSeries[0]!.data)"
        fill="url(#areaGradient)"
        class="area-fill"
        :class="{ visible: chartDrawn }"
      />

      <!-- Series lines -->
      <path
        v-for="(series, si) in chartSeries"
        :key="'line-' + series.name"
        :d="seriesPath(series.data)"
        fill="none"
        :stroke="series.color"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="chart-line"
        :class="{ drawn: chartDrawn }"
        :style="{ '--draw-delay': si * 0.3 + 's' }"
      />

      <!-- Data points -->
      <template
        v-for="(series, si) in chartSeries"
        :key="'pts-' + series.name"
      >
        <circle
          v-for="(pt, pi) in seriesPoints(series.data)"
          :key="pi"
          :cx="pt.x"
          :cy="pt.y"
          r="3"
          :fill="series.color"
          class="chart-point"
          :class="{ visible: chartDrawn }"
          :style="{
            transitionDelay: si * 0.3 + (pi / 11) * 2.5 + 's',
          }"
        />
      </template>
    </svg>

    <!-- Insight Callout -->
    <div
      class="mt-3 sm:mt-4 flex justify-end transition-all duration-500"
      :class="
        calloutVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-3'
      "
    >
      <div
        class="inline-flex items-center gap-2 rounded-lg border border-[var(--pc-yellow)]/30 bg-[var(--pc-yellow)]/10 px-3 py-2"
      >
        <svg
          class="h-4 w-4 text-[var(--pc-yellow)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
        <span class="text-xs sm:text-sm font-semibold text-[var(--pc-yellow)]"
          >Matches up 375% year over year</span
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-text {
  font-family: "Instrument Sans", system-ui, -apple-system, sans-serif;
}

/* Line draw animation */
.chart-line {
  stroke-dasharray: 2000;
  stroke-dashoffset: 2000;
}
.chart-line.drawn {
  animation-name: drawLine;
  animation-duration: 2.5s;
  animation-timing-function: ease-out;
  animation-fill-mode: forwards;
  animation-delay: var(--draw-delay, 0s);
}
@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

/* Data point fade-in */
.chart-point {
  opacity: 0;
  transition: opacity 0.2s ease;
}
.chart-point.visible {
  opacity: 1;
}

/* Area fill fade-in */
.area-fill {
  opacity: 0;
  transition: opacity 1.5s ease 0.5s;
}
.area-fill.visible {
  opacity: 1;
}
</style>
