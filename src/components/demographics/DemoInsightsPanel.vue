<script setup lang="ts">
import { computed } from "vue";
import type { DemoInsightMessage, ConfidenceTier } from "@/api/demographics";
import { sanitizeHtml } from "@/composables/useSafeHtml";

const props = defineProps<{
  message: DemoInsightMessage;
  tier: ConfidenceTier;
}>();

const safeText = computed(() => sanitizeHtml(props.message?.text ?? ""));
</script>

<template>
  <div class="insights-panel" v-if="message && tier !== 'insufficient'">
    <div class="insights-header">
      <p class="insights-eyebrow">Audience signal</p>
      <h3>What Your Data Is Telling You</h3>
    </div>
    <div class="insight-body">
      <div class="insight-text" v-html="safeText"></div>
      <div class="insight-qualifier" v-if="message.qualifier">
        {{ message.qualifier }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.insights-panel {
  background: var(--pc-navy, #1c2430);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--app-card-radius, 2px);
  box-shadow: none;
  padding: 22px 24px;
  color: #fff;
}

.insights-header {
  margin-bottom: 14px;
}

.insights-eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--pc-canary, #facf41);
}

.insights-header h3 {
  margin: 0;
  font-family: var(--pc-font-display, "Oswald", sans-serif);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.insight-body {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--app-card-radius, 2px);
  padding: 16px 18px;
  border-left: 3px solid var(--pc-canary, #facf41);
}

.insight-text {
  font-size: 15px;
  font-weight: 400;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.9);
}

.insight-text :deep(strong) {
  font-weight: 700;
  color: var(--pc-canary, #facf41);
}

.insight-qualifier {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 10px;
}

@media (max-width: 640px) {
  .insights-panel {
    padding: 18px;
  }

  .insight-text {
    font-size: 14px;
  }
}
</style>
