<!-- src/components/analytics/InsightSection.vue -->
<script setup lang="ts">
import type { InsightSection } from "@/api/analytics";

defineProps<{
  section: InsightSection;
}>();

const iconPaths: Record<string, string> = {
  "chart-line": "M3 3v18h18M7 16l4-4 4 4 5-5",
  "map-pin": "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  "calendar": "M16 2v4M8 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  "repeat": "M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3",
  "dollar-sign": "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  "target": "M12 12m-10 0a10 10 0 1 0 20 0 10 10 0 1 0-20 0M12 12m-6 0a6 6 0 1 0 12 0 6 6 0 1 0-12 0M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0",
};
</script>

<template>
  <div class="insight-card">
    <div class="insight-header">
      <div class="insight-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path :d="iconPaths[section.icon] || iconPaths['chart-line']" />
        </svg>
      </div>
      <h4>{{ section.title }}</h4>
    </div>

    <p class="insight-body">{{ section.body }}</p>

    <!-- Highlights -->
    <div class="highlights" v-if="section.highlights?.length">
      <div class="highlight" v-for="(h, i) in section.highlights" :key="i">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{{ h }}</span>
      </div>
    </div>

    <!-- Recommendation -->
    <div class="rec-callout" v-if="section.recommendation">
      <div class="rec-label">Recommendation</div>
      <p>{{ section.recommendation }}</p>
    </div>
  </div>
</template>

<style scoped>
.insight-card {
  background: var(--app-card-bg, #f7f9fb);
  border: 1px solid var(--app-border, #c8d0db);
  border-radius: var(--app-card-radius, 2px);
  box-shadow: none;
  padding: 22px;
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.insight-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--app-card-radius, 2px);
  background: rgba(250, 207, 65, 0.16);
  color: var(--pc-navy, #1c2430);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.insight-header h4 {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--app-text, #1c2430);
  margin: 0;
}

.insight-body {
  font-size: 14px;
  line-height: 1.65;
  color: var(--app-text-body, #3d4a5c);
  margin: 0 0 16px;
}

.highlights {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.highlight {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: var(--app-text-body, #3d4a5c);
}

.highlight svg {
  color: var(--pc-canary-deep, #e5b820);
  flex-shrink: 0;
  margin-top: 2px;
}

.rec-callout {
  background: rgba(28, 36, 48, 0.04);
  border: 1px solid var(--app-border, #c8d0db);
  border-left: 3px solid var(--pc-canary, #facf41);
  border-radius: var(--app-card-radius, 2px);
  padding: 12px 16px;
}

.rec-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--pc-navy, #1c2430);
  margin-bottom: 4px;
}

.rec-callout p {
  font-size: 13px;
  line-height: 1.5;
  color: var(--app-text-body, #3d4a5c);
  margin: 0;
}
</style>
