<!-- src/components/analytics/RecommendationsPanel.vue -->
<script setup lang="ts">
import { ref } from "vue";
import type { Recommendation } from "@/api/analytics";

defineProps<{
  recommendations: Recommendation[];
}>();

const expanded = ref<number | null>(null);

function toggle(index: number) {
  expanded.value = expanded.value === index ? null : index;
}

function priorityClass(p: string): string {
  if (p === "high") return "priority-high";
  if (p === "medium") return "priority-medium";
  return "priority-low";
}
</script>

<template>
  <div class="rec-panel" v-if="recommendations?.length">
    <div class="rec-panel-header">
      <h3>Action Items</h3>
      <span class="rec-count">{{ recommendations.length }} recommendations</span>
    </div>

    <div class="rec-list">
      <div
        v-for="(rec, i) in recommendations"
        :key="i"
        class="rec-item"
        :class="{ 'rec-expanded': expanded === i }"
        @click="toggle(i)"
      >
        <div class="rec-item-main">
          <span class="priority-badge" :class="priorityClass(rec.priority)">
            {{ rec.priority }}
          </span>
          <span class="rec-action">{{ rec.action }}</span>
          <svg
            class="rec-chevron"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        <div class="rec-rationale" v-if="expanded === i">
          {{ rec.rationale }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rec-panel {
  background: var(--app-card-bg, #f7f9fb);
  border: 1px solid var(--app-border, #c8d0db);
  border-radius: var(--app-card-radius, 2px);
  box-shadow: none;
  overflow: hidden;
}

.rec-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px 14px;
  border-bottom: 1px solid var(--app-border, #c8d0db);
}

.rec-panel-header h3 {
  font-family: var(--pc-font-display, "Oswald", sans-serif);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text, #1c2430);
  margin: 0;
}

.rec-count {
  font-size: 12px;
  color: var(--app-text-muted, #8a97a8);
}

.rec-list {
  padding: 14px 22px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rec-item {
  border: 1px solid var(--app-border, #c8d0db);
  border-radius: var(--app-card-radius, 2px);
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.rec-item:hover {
  border-color: var(--pc-navy, #1c2430);
  background: #fff;
}

.rec-item-main {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
}

.priority-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--app-card-radius, 2px);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.priority-high {
  background: rgba(250, 207, 65, 0.22);
  color: var(--pc-navy, #1c2430);
}

.priority-medium {
  background: rgba(28, 36, 48, 0.08);
  color: var(--app-text-secondary, #5a6b7d);
}

.priority-low {
  background: rgba(200, 208, 219, 0.45);
  color: var(--app-text-muted, #8a97a8);
}

.rec-action {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text, #1c2430);
}

.rec-chevron {
  flex-shrink: 0;
  color: var(--app-text-muted, #8a97a8);
  transition: transform 0.15s ease;
}

.rec-expanded .rec-chevron {
  transform: rotate(180deg);
}

.rec-rationale {
  padding: 0 14px 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--app-text-body, #3d4a5c);
  border-top: 1px solid var(--app-border, #c8d0db);
  padding-top: 12px;
  margin: 0 14px;
}
</style>
