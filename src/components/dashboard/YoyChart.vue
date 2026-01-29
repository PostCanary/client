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

// colors (same as Figma)
const cMail = "#163b69";
const cCrm = "#47bfa9";
const cMatch = "#6b6b6b";

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

// ---------- chart build ----------

function buildChart() {
  if (!canvasEl.value) return;

  // BASE datasets (current year)
  const datasets: LineDS[] = [
    {
      label: "Mail Volume",
      data: props.mailNow,
      borderColor: cMail,
      backgroundColor: cMail,
      borderWidth: 3,
      cubicInterpolationMode: "monotone",
      tension: 0.35,
      pointRadius: 3,
    },
    {
      label: "CRM Jobs",
      data: props.crmNow,
      borderColor: cCrm,
      backgroundColor: cCrm,
      borderWidth: 3,
      cubicInterpolationMode: "monotone",
      tension: 0.35,
      pointRadius: 3,
    },
    {
      label: "Matches",
      data: props.matchNow,
      borderColor: cMatch,
      backgroundColor: cMatch,
      borderWidth: 3,
      cubicInterpolationMode: "monotone",
      tension: 0.35,
      pointRadius: 3,
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
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 0,
      },
      {
        label: "CRM Jobs (prev)",
        data: props.crmPrev ?? [],
        borderColor: cCrm,
        backgroundColor: cCrm,
        borderDash: [6, 6],
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 0,
      },
      {
        label: "Matches (prev)",
        data: props.matchPrev ?? [],
        borderColor: cMatch,
        backgroundColor: cMatch,
        borderDash: [6, 6],
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 0,
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
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          callback: (_v, i) => formatTick(i as number),
          maxRotation: 0,
        },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.06)" },
        ticks: { precision: 0 },
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
  <section class="card section p-4">
    <header
      class="yoy-header flex items-center justify-between gap-4 px-2 pt-1 pb-2"
      role="toolbar"
    >
      <div class="flex items-center gap-3 shrink-0">
        <span class="text-[#0c2d50] font-semibold text-[15px]">
          Show YoY Overlay
        </span>

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

      <ul
        class="yoy-legend flex items-center gap-6 flex-wrap text-[14px] text-black/80"
      >
        <li class="flex items-center gap-2">
          <span class="legend-swatch bg-[#163b69]" /> Mail Volume
        </li>
        <li class="flex items-center gap-2">
          <span class="legend-swatch bg-[#47bfa9]" /> CRM Jobs
        </li>
        <li class="flex items-center gap-2">
          <span class="legend-swatch bg-[#6b6b6b]" /> Matches
        </li>
        <li v-if="hasPrevData" class="flex items-center gap-2 text-xs">
          <span class="legend-dash" /> Dashed lines show previous year
        </li>
        <li v-else class="text-xs text-black/45">
          YoY overlay will appear once there is prior-year data
        </li>
      </ul>
    </header>

    <div class="mt-2 px-2 pb-3">
      <div class="relative h-80">
        <canvas ref="canvasEl" class="block w-full h-full"></canvas>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card {
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(12, 45, 80, 0.08),
    0 10px 24px rgba(12, 45, 80, 0.06);
  background: #fff;
}
.section {
  border: 1px solid rgba(12, 45, 80, 0.06);
}

/* YoY switch */
.switch {
  position: relative;
  width: 42px;
  height: 24px;
  border: 0;
  background: transparent;
  padding: 0;
  border-radius: 9999px;
  cursor: pointer;
}
.switch__track {
  position: absolute;
  inset: 0;
  background: #e9eef3;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px rgba(12, 45, 80, 0.08);
  transition: background 160ms ease;
}
.switch__thumb {
  position: absolute;
  top: 50%;
  left: 2px;
  width: 20px;
  height: 20px;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #163b69, #47bfa9);
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(12, 45, 80, 0.25);
  transition: left 160ms ease, transform 160ms ease;
  pointer-events: none;
}
.switch.is-on .switch__track {
  background: #47bfa9;
}
.switch.is-on .switch__thumb {
  left: calc(100% - 22px);
}
.switch.is-disabled {
  cursor: not-allowed;
}
.switch.is-disabled .switch__track {
  background: #e2e8f0;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.12);
}
.switch.is-disabled .switch__thumb {
  background: #cbd5f5;
  box-shadow: none;
}

/* legend chips */
.legend-swatch {
  display: inline-block;
  width: 24px;
  height: 6px;
  border-radius: 9999px;
}
.legend-dash {
  display: inline-block;
  width: 24px;
  height: 0;
  border-top: 2px dashed #111;
}
</style>
