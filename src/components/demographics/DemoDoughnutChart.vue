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

const navy = "#0b2d50";
const teal = "#47bfa9";
const slate = "#94a3b8";

function buildChart() {
  if (!canvasEl.value) return;

  chart = new Chart(canvasEl.value, {
    type: "doughnut",
    data: {
      labels: props.labels,
      datasets: [
        {
          data: props.values,
          backgroundColor: [navy, teal, slate, "#cbd5e1"],
          borderWidth: 0,
          spacing: 3,
          borderRadius: 4,
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
            pointStyle: "rectRounded",
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
  background: var(--app-card-bg, #fff);
  border-radius: var(--app-card-radius, 12px);
  box-shadow: var(--app-card-shadow);
  overflow: hidden;
}

.chart-card-header { padding: 16px 20px 0; }
.chart-card-header h3 { font-size: 15px; font-weight: 600; color: var(--app-text, #0c2d50); }
.chart-sub { font-size: 12px; color: var(--app-text-muted, #94a3b8); margin-top: 2px; }

.chart-card-body { padding: 8px 16px 16px; }
.chart-card-body canvas { width: 100% !important; height: 260px !important; }
</style>
