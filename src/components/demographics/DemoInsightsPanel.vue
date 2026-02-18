<script setup lang="ts">
import type { DemoInsightMessage, ConfidenceTier } from "@/api/demographics";

defineProps<{
  message: DemoInsightMessage;
  tier: ConfidenceTier;
}>();
</script>

<template>
  <div class="insights-panel" v-if="message && tier !== 'insufficient'">
    <div class="insights-header">
      <h3>What Your Data Is Telling You</h3>
    </div>
    <div class="insight-body">
      <div class="insight-text" v-html="message.text"></div>
      <div class="insight-qualifier" v-if="message.qualifier">
        {{ message.qualifier }}
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
  margin-bottom: 12px;
}

.insights-header h3 {
  font-size: 15px;
  font-weight: 600;
}

.insight-body {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 18px;
  border-left: 3px solid var(--app-teal, #47bfa9);
}

.insight-text {
  font-size: 15px;
  font-weight: 400;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
}

.insight-text :deep(strong) {
  font-weight: 700;
  color: var(--app-teal, #47bfa9);
}

.insight-qualifier {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 8px;
  font-style: italic;
}

@media (max-width: 640px) {
  .insights-panel { padding: 18px; }
  .insight-text { font-size: 14px; }
}
</style>
