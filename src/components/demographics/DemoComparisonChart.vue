<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import Chart from "chart.js/auto";

const props = defineProps<{
  labels: string[];
  mailed: number[];
  responded: number[];
}>();

const canvasEl = ref<HTMLCanvasElement | null>(null);
let chart: Chart<"bar", number[], string> | null = null;

const navy = "#0b2d50";
const teal = "#47bfa9";

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
          backgroundColor: "rgba(148,163,184,0.35)",
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 40,
        },
        {
          label: "Customers Who Responded",
          data: props.responded,
          backgroundColor: teal,
          borderRadius: 6,
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
            pointStyle: "rectRounded",
            padding: 20,
            font: { size: 13 },
            color: "#475569",
          },
        },
        tooltip: {
          backgroundColor: navy,
          titleColor: "#fff",
          bodyColor: "rgba(255,255,255,0.85)",
          borderColor: teal,
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          titleFont: { size: 13, weight: "bold" },
          bodyFont: { size: 12 },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { font: { size: 12 }, color: "#94a3b8" },
        },
        y: {
          grid: { color: "rgba(12,45,80,0.04)" },
          border: { display: false },
          ticks: {
            font: { size: 12 },
            color: "#94a3b8",
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

watch(() => [props.labels, props.mailed, props.responded], rebuild);
</script>

<template>
  <div class="chart-full">
    <div class="chart-card-header">
      <h3>Where You're Sending vs. Who's Responding</h3>
      <div class="chart-sub">
        Gray = everyone you mailed, teal = customers who actually responded.
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
  background: var(--app-card-bg, #fff);
  border-radius: var(--app-card-radius, 12px);
  box-shadow: var(--app-card-shadow);
  overflow: hidden;
}

.chart-card-header { padding: 16px 20px 0; }
.chart-card-header h3 { font-size: 15px; font-weight: 600; color: var(--app-text, #0c2d50); }
.chart-sub { font-size: 12px; color: var(--app-text-muted, #94a3b8); margin-top: 2px; }

.chart-card-body { padding: 8px 16px 16px; }
.chart-card-body canvas { width: 100% !important; height: 280px !important; }
</style>
