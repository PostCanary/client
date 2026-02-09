<!-- src/components/home/HeroDemoAnimation.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

/* ── KPI card config ─────────────────────────────────────── */
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
  { label: "Total Mail", value: 15420, border: "var(--pc-cyan)" },
  { label: "Unique Addresses", value: 14837, border: "var(--pc-yellow)" },
  { label: "Total Jobs", value: 892, border: "var(--pc-cyan)" },
  { label: "Matches", value: 487, sub: "3.2% match rate", border: "var(--pc-yellow)" },
  { label: "Match Revenue", value: 24350, prefix: "$", sub: "$1.58 per mailer", border: "var(--pc-cyan)" },
  { label: "Avg Ticket", value: 50, prefix: "$", decimals: 2, sub: "23 days to convert", border: "var(--pc-yellow)" },
];

/* ── Chart config ────────────────────────────────────────── */
const CV = { w: 700, h: 260, pl: 38, pr: 10, pt: 15, pb: 28, maxY: 90 } as const;
const cW = CV.w - CV.pl - CV.pr;
const cH = CV.h - CV.pt - CV.pb;

const chartMonths = [
  "JAN '24", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  "JAN '25", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const chartSeries = [
  {
    name: "Mail Volume",
    color: "var(--pc-text)",
    data: [32, 59, 48, 49, 45, 44, 45, 37, 47, 46, 45, 45, 55, 60, 65, 68, 60, 58, 57, 48, 62, 63, 60, 82],
  },
  {
    name: "CRM Jobs",
    color: "var(--pc-cyan)",
    data: [3, 12, 22, 23, 21, 20, 21, 20, 8, 21, 24, 26, 10, 25, 30, 29, 28, 29, 30, 28, 28, 30, 35, 22],
  },
  {
    name: "Matches",
    color: "var(--pc-text-soft)",
    data: [2, 8, 5, 4, 3, 3, 3, 3, 5, 5, 5, 5, 7, 8, 10, 10, 8, 7, 7, 5, 5, 5, 7, 4],
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

const gridLines = [0, 30, 60, 90].map((v) => ({ y: toY(v), label: String(v) }));

const xAxisLabels = chartMonths
  .map((label, i) => ({ x: toX(i), label, i }))
  .filter(({ i }) => i % 3 === 0 || i === chartMonths.length - 1);

/* ── Animation state ─────────────────────────────────────── */
const phase = ref<0 | 1 | 2 | 3 | 4>(0);
const progress1 = ref(0);
const progress2 = ref(0);
const kpiVisible = ref<boolean[]>(new Array(6).fill(false));
const kpiDisplayValues = ref<number[]>(new Array(6).fill(0));
const chartDrawn = ref(false);
const fading = ref(false);

let animFrame: number | null = null;
let timeouts: ReturnType<typeof setTimeout>[] = [];
let unmounted = false;

function clearTimers() {
  timeouts.forEach(clearTimeout);
  timeouts = [];
  if (animFrame) cancelAnimationFrame(animFrame);
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

function animateProgress(
  progressRef: typeof progress1,
  durationMs: number,
): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now: number) => {
      if (unmounted) return;
      const elapsed = now - start;
      const t = Math.min(elapsed / durationMs, 1);
      progressRef.value = t * 100;
      if (t < 1) {
        animFrame = requestAnimationFrame(tick);
      } else {
        progressRef.value = 100;
        resolve();
      }
    };
    animFrame = requestAnimationFrame(tick);
  });
}

/* ── Main sequence ───────────────────────────────────────── */
async function runSequence() {
  if (unmounted) return;

  // Reset
  phase.value = 0;
  progress1.value = 0;
  progress2.value = 0;
  kpiVisible.value = new Array(6).fill(false);
  kpiDisplayValues.value = new Array(6).fill(0);
  chartDrawn.value = false;
  fading.value = false;

  await delay(400);
  if (unmounted) return;

  // Phase 1: Upload
  phase.value = 1;
  animateProgress(progress2, 2600);
  await animateProgress(progress1, 2400);
  await delay(300);
  if (unmounted) return;

  // Phase 2: Results banner
  phase.value = 2;
  await delay(900);
  if (unmounted) return;

  // Phase 3: KPI cards
  phase.value = 3;
  for (let i = 0; i < 6; i++) {
    if (unmounted) return;
    await delay(200);
    kpiVisible.value[i] = true;
    countUp(i, kpis[i]!.value, 1200);
  }

  // Wait for count-up to finish
  await delay(1400);
  if (unmounted) return;

  // Phase 4: Trend chart
  phase.value = 4;
  await delay(300);
  chartDrawn.value = true;
  await delay(3500);

  // Hold final state
  await delay(3000);
  if (unmounted) return;

  // Fade out then loop
  fading.value = true;
  await delay(800);
  if (unmounted) return;

  runSequence();
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => {
    const id = setTimeout(r, ms);
    timeouts.push(id);
  });
}

onMounted(() => {
  runSequence();
});

onUnmounted(() => {
  unmounted = true;
  clearTimers();
});
</script>

<template>
  <div
    class="demo-root w-full rounded-2xl bg-[var(--pc-navy)] p-4 sm:p-6 transition-opacity duration-700"
    :class="{ 'opacity-0': fading }"
  >
    <!-- Phase 1: Upload Cards -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 transition-all duration-500"
      :class="phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'"
    >
      <!-- Mail CSV Card -->
      <div class="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-card)] p-3 sm:p-4">
        <div class="flex items-center gap-2 mb-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--pc-navy-2)]">
            <svg class="h-4 w-4 text-[var(--pc-cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <span class="text-sm font-semibold text-[var(--pc-text)]">Mail CSV</span>
        </div>
        <div class="mb-3 rounded-lg border-2 border-dashed border-[var(--pc-cyan)]/40 bg-[var(--pc-navy-2)] p-3 sm:p-4 text-center">
          <svg class="mx-auto h-6 w-6 text-[var(--pc-cyan)]/60 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-xs text-[var(--pc-text-soft)]">mail_data.csv</p>
        </div>
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-[var(--pc-text-muted)]">
              {{ progress1 < 100 ? 'Uploading mail data...' : 'Upload complete' }}
            </span>
            <span class="text-xs font-medium text-[var(--pc-cyan)]">{{ Math.round(progress1) }}%</span>
          </div>
          <div class="h-2 w-full rounded-full bg-[var(--pc-navy)] overflow-hidden">
            <div
              class="h-full rounded-full transition-none"
              style="background: linear-gradient(90deg, var(--pc-cyan), #00cccc)"
              :style="{ width: progress1 + '%' }"
            />
          </div>
        </div>
      </div>

      <!-- CRM CSV Card -->
      <div class="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-card)] p-3 sm:p-4">
        <div class="flex items-center gap-2 mb-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--pc-navy-2)]">
            <svg class="h-4 w-4 text-[var(--pc-cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <span class="text-sm font-semibold text-[var(--pc-text)]">CRM CSV</span>
        </div>
        <div class="mb-3 rounded-lg border-2 border-dashed border-[var(--pc-cyan)]/40 bg-[var(--pc-navy-2)] p-3 sm:p-4 text-center">
          <svg class="mx-auto h-6 w-6 text-[var(--pc-cyan)]/60 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-xs text-[var(--pc-text-soft)]">crm_export.csv</p>
        </div>
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-[var(--pc-text-muted)]">
              {{ progress2 < 100 ? 'Uploading CRM data...' : 'Upload complete' }}
            </span>
            <span class="text-xs font-medium text-[var(--pc-cyan)]">{{ Math.round(progress2) }}%</span>
          </div>
          <div class="h-2 w-full rounded-full bg-[var(--pc-navy)] overflow-hidden">
            <div
              class="h-full rounded-full transition-none"
              style="background: linear-gradient(90deg, var(--pc-cyan), #00cccc)"
              :style="{ width: progress2 + '%' }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Phase 2: Results Banner -->
    <Transition name="phase-slide">
      <div
        v-if="phase >= 2"
        class="mt-3 sm:mt-4 rounded-xl border border-[var(--pc-border)] px-4 sm:px-5 py-3 flex items-center justify-between"
        style="background: linear-gradient(135deg, var(--pc-navy-2), var(--pc-card))"
      >
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5 text-[var(--pc-cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm sm:text-base font-bold text-[var(--pc-text)]">Results</span>
        </div>
        <span class="text-xs sm:text-sm text-[var(--pc-yellow)] font-medium">Campaign Analysis Complete</span>
      </div>
    </Transition>

    <!-- Phase 3: KPI Cards -->
    <div v-if="phase >= 3" class="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
      <div
        v-for="(kpi, i) in kpis"
        :key="kpi.label"
        class="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-card)] p-3 sm:p-4 transition-all duration-500"
        :class="[
          kpiVisible[i]
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4',
        ]"
        :style="{ borderLeft: '3px solid ' + kpi.border }"
      >
        <p class="text-[10px] sm:text-xs font-medium text-[var(--pc-text-soft)] uppercase tracking-wide mb-1">
          {{ kpi.label }}
        </p>
        <p class="text-base sm:text-xl lg:text-2xl font-bold text-[var(--pc-text)] leading-tight">
          {{ kpi.prefix || '' }}{{ fmt(kpiDisplayValues[i], kpi.decimals ?? 0) }}{{ kpi.suffix || '' }}
        </p>
        <p v-if="kpi.sub" class="text-[10px] sm:text-xs text-[var(--pc-text-muted)] mt-0.5">
          {{ kpi.sub }}
        </p>
      </div>
    </div>

    <!-- Phase 4: Trend Chart -->
    <Transition name="phase-slide">
      <div
        v-if="phase >= 4"
        class="mt-3 sm:mt-4 rounded-xl border border-[var(--pc-border)] bg-[var(--pc-card)] p-3 sm:p-4"
      >
        <!-- Legend -->
        <div class="flex items-center justify-end gap-3 sm:gap-4 mb-2">
          <div
            v-for="series in chartSeries"
            :key="series.name"
            class="flex items-center gap-1.5"
          >
            <span
              class="inline-block h-2 w-2 rounded-full"
              :style="{ backgroundColor: series.color }"
            />
            <span class="text-[9px] sm:text-[10px] text-[var(--pc-text-muted)]">
              {{ series.name }}
            </span>
          </div>
        </div>

        <!-- SVG Chart -->
        <svg
          :viewBox="`0 0 ${CV.w} ${CV.h}`"
          class="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
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
            :x="CV.pl - 6"
            :y="gl.y"
            text-anchor="end"
            dominant-baseline="central"
            fill="var(--pc-text-soft)"
            font-size="8"
            class="chart-text"
          >
            {{ gl.label }}
          </text>

          <!-- X-axis labels -->
          <text
            v-for="xl in xAxisLabels"
            :key="'xl-' + xl.i"
            :x="xl.x"
            :y="CV.h - 8"
            text-anchor="middle"
            fill="var(--pc-text-soft)"
            font-size="7"
            class="chart-text"
          >
            {{ xl.label }}
          </text>

          <!-- Series lines -->
          <path
            v-for="(series, si) in chartSeries"
            :key="'line-' + series.name"
            :d="seriesPath(series.data)"
            fill="none"
            :stroke="series.color"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="chart-line"
            :class="{ drawn: chartDrawn }"
            :style="{ '--draw-delay': (si * 0.3) + 's' }"
          />

          <!-- Data points -->
          <template v-for="(series, si) in chartSeries" :key="'pts-' + series.name">
            <circle
              v-for="(pt, pi) in seriesPoints(series.data)"
              :key="pi"
              :cx="pt.x"
              :cy="pt.y"
              r="2.5"
              :fill="series.color"
              class="chart-point"
              :class="{ visible: chartDrawn }"
              :style="{ transitionDelay: (si * 0.3 + (pi / 23) * 2.5) + 's' }"
            />
          </template>
        </svg>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.demo-root {
  font-family: "Instrument Sans", system-ui, -apple-system, sans-serif;
}

.chart-text {
  font-family: "Instrument Sans", system-ui, -apple-system, sans-serif;
}

/* Phase enter transition (used by <Transition name="phase-slide">) */
.phase-slide-enter-active {
  transition: all 0.5s ease;
}
.phase-slide-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.phase-slide-leave-active {
  transition: none;
}
.phase-slide-leave-to {
  display: none;
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
</style>
