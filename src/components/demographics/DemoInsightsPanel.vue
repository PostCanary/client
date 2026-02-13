<script setup lang="ts">
import type { DemoInsight } from "@/api/demographics";

defineProps<{
  insights: DemoInsight[];
}>();

function isNegative(type: string): boolean {
  return type === "low_return" || type === "consider_cutting";
}
</script>

<template>
  <div class="insights-panel" v-if="insights.length > 0">
    <div class="insights-header">
      <h3>What Your Data Is Telling You</h3>
      <span class="insights-subtitle">Based on all your uploads</span>
    </div>
    <div class="insights-grid">
      <div
        v-for="(insight, i) in insights"
        :key="i"
        class="insight-item"
        :class="{ negative: isNegative(insight.type) }"
      >
        <div class="insight-label">{{ insight.title }}</div>
        <div class="insight-text" v-html="insight.description"></div>
        <div class="insight-stat">{{ insight.stat }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.insights-panel {
  background: linear-gradient(135deg, var(--app-navy, #0b2d50) 0%, #163b69 100%);
  border-radius: var(--app-card-radius, 12px);
  box-shadow: var(--app-card-shadow);
  padding: 24px;
  color: #fff;
}

.insights-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.insights-header h3 {
  font-size: 15px;
  font-weight: 600;
}

.insights-subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 400;
}

.insights-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.insight-item {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 18px;
  border-left: 3px solid var(--app-teal, #47bfa9);
}

.insight-item.negative {
  border-left-color: #f59e0b;
}

.insight-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
  font-weight: 600;
}

.insight-text {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
}

.insight-stat {
  font-size: 22px;
  font-weight: 700;
  color: var(--app-teal, #47bfa9);
  margin-top: 8px;
}

.insight-item.negative .insight-stat {
  color: #f59e0b;
}

@media (max-width: 1024px) {
  .insights-grid { grid-template-columns: 1fr; }
}
</style>
