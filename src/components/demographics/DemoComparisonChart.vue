<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import Chart from "chart.js/auto";

const props = defineProps<{
  labels: string[];
  mailed: number[];
  matched: number[];
}>();

const canvasEl = ref<HTMLCanvasElement | null>(null);
let chart: Chart<"bar", number[], string> | null = null;

const NAVY = "#1c2430";
const CANARY = "#facf41";
const MUTED = "#8a97a8";
const GRID = "rgba(255,255,255,0.08)";

function buildChart() {
  if (!canvasEl.value) return;

  chart = new Chart(canvasEl.value, {
    type: "bar",
    data: {
      labels: props.labels,
      datasets: [
        {
          label: "Everyone You Mailed",
          data: props.mailed,
          backgroundColor: "rgba(174, 184, 196, 0.35)",
          borderRadius: 2,
          borderSkipped: false,
          maxBarThickness: 40,
        },
        {
          label: "Customers Who Converted",
          data: props.matched,
          backgroundColor: CANARY,
          borderRadius: 2,
          borderSkipped: false,
          maxBarThickness: 40,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            usePointStyle: true,
            pointStyle: "rect",
            padding: 20,
            font: { size: 12, family: "Instrument Sans, sans-serif" },
            color: "rgba(255,255,255,0.75)",
          },
        },
        tooltip: {
          backgroundColor: NAVY,
          titleColor: "#fff",
          bodyColor: "rgba(255,255,255,0.85)",
          borderColor: CANARY,
          borderWidth: 1,
          cornerRadius: 2,
          padding: 12,
          titleFont: { size: 13, weight: "bold", family: "Instrument Sans, sans-serif" },
          bodyFont: { size: 12, family: "Instrument Sans, sans-serif" },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            font: { size: 12, family: "Instrument Sans, sans-serif" },
            color: MUTED,
          },
        },
        y: {
          grid: { color: GRID },
          border: { display: false },
          ticks: {
            font: { size: 12, family: "Instrument Sans, sans-serif" },
            color: MUTED,
            callback: (v) => `${v}%`,
          },
          beginAtZero: true,
        },
      },
    },
  });
}

function rebuild() {
  chart?.destroy();
  chart = null;
  buildChart();
}

onMounted(buildChart);
onBeforeUnmount(() => {
  chart?.destroy();
  chart = null;
});

watch(() => [props.labels, props.mailed, props.matched], rebuild);
</script>

<template>
  <div class="chart-full">
    <div class="chart-card-header">
      <h3>Where You're Sending vs. Who's Converting</h3>
      <div class="chart-sub">
        Gray = everyone you mailed. Canary = customers who converted.
        Bigger gaps = bigger opportunities.
      </div>
    </div>
    <div class="chart-card-body">
      <canvas ref="canvasEl"></canvas>
    </div>
  </div>
</template>

<style scoped>
.chart-full {
  background: var(--pc-navy, #1c2430);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--app-card-radius, 2px);
  box-shadow: none;
  overflow: hidden;
}

.chart-card-header {
  padding: 16px 20px 0;
}

.chart-card-header h3 {
  margin: 0;
  font-family: var(--pc-font-display, "Oswald", sans-serif);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
}

.chart-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  margin-top: 4px;
  max-width: 52rem;
}

.chart-card-body {
  padding: 8px 16px 16px;
}

.chart-card-body canvas {
  width: 100% !important;
  height: 280px !important;
}
</style>
