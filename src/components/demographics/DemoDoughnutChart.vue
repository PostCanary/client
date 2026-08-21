<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import Chart from "chart.js/auto";

const props = defineProps<{
  title: string;
  subtitle?: string;
  labels: string[];
  values: number[];
}>();

const canvasEl = ref<HTMLCanvasElement | null>(null);
let chart: Chart<"doughnut", number[], string> | null = null;

const NAVY = "#1c2430";
const CANARY = "#facf41";
const SLATE = "#8a97a8";
const LIGHT = "#c8d0db";

function buildChart() {
  if (!canvasEl.value) return;

  chart = new Chart(canvasEl.value, {
    type: "doughnut",
    data: {
      labels: props.labels,
      datasets: [
        {
          data: props.values,
          backgroundColor: [CANARY, "rgba(250, 207, 65, 0.45)", SLATE, LIGHT],
          borderWidth: 0,
          spacing: 2,
          borderRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: {
          position: "right",
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyle: "rect",
            font: { size: 13, family: "Instrument Sans, sans-serif" },
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

watch(() => [props.labels, props.values], rebuild);
</script>

<template>
  <div class="chart-card">
    <div class="chart-card-header">
      <h3>{{ title }}</h3>
      <div class="chart-sub" v-if="subtitle">{{ subtitle }}</div>
    </div>
    <div class="chart-card-body">
      <canvas ref="canvasEl"></canvas>
    </div>
  </div>
</template>

<style scoped>
.chart-card {
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
}

.chart-card-body {
  padding: 8px 16px 16px;
}

.chart-card-body canvas {
  width: 100% !important;
  height: 260px !important;
}
</style>
