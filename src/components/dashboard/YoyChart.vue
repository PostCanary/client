<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from "vue";
import Chart, { type ChartDataset, type ChartOptions } from "chart.js/auto";

type LineDS = ChartDataset<"line", number[]>;

const props = withDefaults(
  defineProps<{
    labels: string[];
    mailNow: number[];
    crmNow: number[];
    matchNow: number[];
    mailPrev?: number[];
    crmPrev?: number[];
    matchPrev?: number[];
    rawMonths?: string[];
  }>(),
  {
    labels: () => [],
    rawMonths: () => [],
  }
);

const showYoy = ref(true);
const canvasEl = ref<HTMLCanvasElement | null>(null);
let chart: Chart<"line", number[], string> | null = null;

// colors
const cMail = "#0b2d50";
const cCrm = "#47bfa9";
const cMatch = "#94a3b8";

// ---------- helpers ----------

const MONTH_ABBR = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

function formatTick(i: number): string {
  const raw = props.rawMonths?.[i];
  if (raw) {
    const [year, month] = raw.split("-");
    const mi = Number(month || "1") - 1;
    const mon = MONTH_ABBR[mi] ?? raw;
    if (month === "01" && year) {
      const shortYear = year.slice(-2);
      return `${mon} '${shortYear}`;
    }
    return mon;
  }
  return (props.labels[i] || "").toString().toUpperCase();
}

const hasPrevData = computed(() => {
  const allPrev = [
    ...(props.mailPrev ?? []),
    ...(props.crmPrev ?? []),
    ...(props.matchPrev ?? []),
  ];
  if (!allPrev.length) return false;
  return allPrev.some((v) => Number(v || 0) !== 0);
});

// ---------- gradient helpers ----------

function createGradient(
  ctx: CanvasRenderingContext2D,
  color: string,
  alpha: number
): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, 0, 320);
  gradient.addColorStop(0, `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`);
  gradient.addColorStop(1, `${color}00`);
  return gradient;
}

// ---------- chart build ----------

function buildChart() {
  if (!canvasEl.value) return;
  const ctx = canvasEl.value.getContext("2d");
  if (!ctx) return;

  // BASE datasets (current year)
  const datasets: LineDS[] = [
    {
      label: "Mail Volume",
      data: props.mailNow,
      borderColor: cMail,
      backgroundColor: createGradient(ctx, cMail, 0.08),
      borderWidth: 2.5,
      cubicInterpolationMode: "monotone",
      tension: 0.35,
      pointRadius: 4,
      pointBackgroundColor: "#fff",
      pointBorderColor: cMail,
      pointBorderWidth: 2,
      pointHoverRadius: 6,
      fill: true,
    },
    {
      label: "CRM Jobs",
      data: props.crmNow,
      borderColor: cCrm,
      backgroundColor: createGradient(ctx, cCrm, 0.08),
      borderWidth: 2.5,
      cubicInterpolationMode: "monotone",
      tension: 0.35,
      pointRadius: 4,
      pointBackgroundColor: "#fff",
      pointBorderColor: cCrm,
      pointBorderWidth: 2,
      pointHoverRadius: 6,
      fill: true,
    },
    {
      label: "Matches",
      data: props.matchNow,
      borderColor: cMatch,
      backgroundColor: createGradient(ctx, cMatch, 0.06),
      borderWidth: 2.5,
      cubicInterpolationMode: "monotone",
      tension: 0.35,
      pointRadius: 4,
      pointBackgroundColor: "#fff",
      pointBorderColor: cMatch,
      pointBorderWidth: 2,
      pointHoverRadius: 6,
      fill: true,
    },
  ];

  // YOY overlay (only if we actually have previous-year data and toggle is on)
  if (hasPrevData.value && showYoy.value) {
    datasets.push(
      {
        label: "Mail Volume (prev)",
        data: props.mailPrev ?? [],
        borderColor: cMail,
        backgroundColor: cMail,
        borderDash: [6, 6],
        borderWidth: 1.5,
        tension: 0.35,
        pointRadius: 0,
        fill: false,
      },
      {
        label: "CRM Jobs (prev)",
        data: props.crmPrev ?? [],
        borderColor: cCrm,
        backgroundColor: cCrm,
        borderDash: [6, 6],
        borderWidth: 1.5,
        tension: 0.35,
        pointRadius: 0,
        fill: false,
      },
      {
        label: "Matches (prev)",
        data: props.matchPrev ?? [],
        borderColor: cMatch,
        backgroundColor: cMatch,
        borderDash: [6, 6],
        borderWidth: 1.5,
        tension: 0.35,
        pointRadius: 0,
        fill: false,
      }
    );
  }

  const maxNow = Math.max(
    ...(props.mailNow ?? []),
    ...(props.crmNow ?? []),
    ...(props.matchNow ?? []),
    0
  );

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "#0b2d50",
        titleColor: "#fff",
        bodyColor: "rgba(255,255,255,0.85)",
        borderColor: "#47bfa9",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: { weight: "bold" as const, size: 13 },
        bodyFont: { size: 12 },
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          callback: (_v, i) => formatTick(i as number),
          maxRotation: 0,
          color: "#94a3b8",
          font: { size: 12 },
        },
      },
      y: {
        grid: { color: "rgba(12,45,80,0.04)" },
        border: { display: false },
        ticks: {
          precision: 0,
          color: "#94a3b8",
          font: { size: 12 },
        },
        suggestedMin: 0,
        suggestedMax: maxNow || undefined,
      },
    },
  };

  chart = new Chart<"line", number[], string>(canvasEl.value, {
    type: "line",
    data: {
      labels: props.labels,
      datasets,
    },
    options,
  });
}

function rebuild() {
  chart?.destroy();
  chart = null;
  buildChart();
}

// ---------- lifecycle ----------

onMounted(buildChart);
onBeforeUnmount(() => {
  chart?.destroy();
  chart = null;
});

// Rebuild when data changes
watch(
  () => [
    props.labels,
    props.mailNow,
    props.crmNow,
    props.matchNow,
    props.mailPrev,
    props.crmPrev,
    props.matchPrev,
    props.rawMonths,
  ],
  () => {
    rebuild();
  }
);

// Rebuild when YoY toggle changes
watch(
  () => showYoy.value,
  () => {
    rebuild();
  }
);
</script>

<template>
  <section class="chart-card">
    <header class="chart-header">
      <div class="chart-toggle">
        <span class="toggle-label">Show YoY Overlay</span>

        <button
          type="button"
          class="switch"
          :class="{
            'is-on': showYoy && hasPrevData,
            'is-disabled': !hasPrevData,
          }"
          role="switch"
          :aria-pressed="showYoy && hasPrevData"
          :aria-disabled="!hasPrevData"
          :disabled="!hasPrevData"
          @click="hasPrevData && (showYoy = !showYoy)"
          aria-label="Toggle YoY overlay"
        >
          <span class="switch__track"></span>
          <span class="switch__thumb"></span>
        </button>
      </div>

      <ul class="chart-legend">
        <li class="legend-item">
          <span class="legend-dot" style="background: #0b2d50"></span>
          <span>Mail Volume</span>
        </li>
        <li class="legend-item">
          <span class="legend-dot" style="background: #47bfa9"></span>
          <span>CRM Jobs</span>
        </li>
        <li class="legend-item">
          <span class="legend-dot" style="background: #94a3b8"></span>
          <span>Matches</span>
        </li>
        <li v-if="hasPrevData" class="legend-item legend-item-note">
          <span class="legend-dash"></span>
          <span>Prior year</span>
        </li>
        <li v-else class="legend-item legend-item-note">
          YoY overlay will appear once there is prior-year data
        </li>
      </ul>
    </header>

    <div class="chart-body">
      <div class="chart-canvas-wrap">
        <canvas ref="canvasEl" class="block w-full h-full"></canvas>
      </div>
    </div>
  </section>
</template>

<style scoped>
.chart-card {
  background: var(--app-card-bg, #fff);
  border-radius: var(--app-card-radius, 12px);
  box-shadow: var(--app-card-shadow, 0 1px 3px rgba(12,45,80,.06), 0 8px 24px rgba(12,45,80,.04));
  overflow: hidden;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px 8px;
  flex-wrap: wrap;
}

.chart-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.toggle-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
}

/* Legend */
.chart-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--app-text-body, #475569);
}

.legend-item-note {
  font-size: 12px;
  color: var(--app-text-muted, #94a3b8);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dash {
  display: inline-block;
  width: 16px;
  height: 0;
  border-top: 2px dashed var(--app-text-muted, #94a3b8);
}

/* Chart body */
.chart-body {
  padding: 4px 16px 16px;
}

.chart-canvas-wrap {
  position: relative;
  height: 320px;
}

/* YoY switch */
.switch {
  position: relative;
  width: 40px;
  height: 22px;
  border: 0;
  background: transparent;
  padding: 0;
  border-radius: 9999px;
  cursor: pointer;
}
.switch__track {
  position: absolute;
  inset: 0;
  background: #e2e8f0;
  border-radius: inherit;
  transition: background 160ms ease;
}
.switch__thumb {
  position: absolute;
  top: 50%;
  left: 2px;
  width: 18px;
  height: 18px;
  transform: translateY(-50%);
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(12, 45, 80, 0.2);
  transition: left 160ms ease;
  pointer-events: none;
}
.switch.is-on .switch__track {
  background: var(--app-teal, #47bfa9);
}
.switch.is-on .switch__thumb {
  left: calc(100% - 20px);
}
.switch.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
