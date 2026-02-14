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
  background: var(--app-card-bg, #fff);
  border-radius: var(--app-card-radius, 12px);
  box-shadow: var(--app-card-shadow, 0 1px 3px rgba(12,45,80,.06), 0 8px 24px rgba(12,45,80,.04));
  overflow: hidden;
}

.rec-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
}

.rec-panel-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--app-text, #0c2d50);
  margin: 0;
}

.rec-count {
  font-size: 12px;
  color: var(--app-text-muted, #94a3b8);
}

.rec-list {
  padding: 0 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rec-item {
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.rec-item:hover {
  border-color: var(--app-border-medium, #dde3ea);
  box-shadow: 0 1px 3px rgba(12, 45, 80, 0.04);
}

.rec-item-main {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
}

.priority-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
  flex-shrink: 0;
}

.priority-high {
  background: rgba(71, 191, 169, 0.1);
  color: var(--app-teal, #47bfa9);
}

.priority-medium {
  background: rgba(148, 163, 184, 0.1);
  color: var(--app-text-muted, #94a3b8);
}

.priority-low {
  background: rgba(203, 213, 225, 0.2);
  color: #94a3b8;
}

.rec-action {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text, #0c2d50);
}

.rec-chevron {
  flex-shrink: 0;
  color: var(--app-text-muted, #94a3b8);
  transition: transform 0.15s ease;
}

.rec-expanded .rec-chevron {
  transform: rotate(180deg);
}

.rec-rationale {
  padding: 0 16px 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--app-text-body, #475569);
  border-top: 1px solid var(--app-border, #e2e8f0);
  padding-top: 12px;
  margin: 0 16px;
}
</style>
