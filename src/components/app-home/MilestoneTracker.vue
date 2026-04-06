<!-- src/components/app-home/MilestoneTracker.vue -->
<script setup lang="ts">
import type { MilestoneProgress } from '@/types/home'
import { TrophyOutline } from '@vicons/ionicons5'

const props = defineProps<{
  milestone: MilestoneProgress
}>()
</script>

<template>
  <div v-if="!milestone.isEligible" class="milestone-card">
    <div class="milestone-header">
      <component :is="TrophyOutline" class="milestone-icon" />
      <h4 class="milestone-title">Autopilot Progress</h4>
    </div>

    <div class="milestone-bar-wrap">
      <div class="milestone-bar">
        <div class="milestone-fill" :style="{ width: milestone.progressPercent + '%' }"></div>
      </div>
      <span class="milestone-count">{{ milestone.campaignsCompleted }}/{{ milestone.campaignsRequired }}</span>
    </div>

    <p class="milestone-label">{{ milestone.nextMilestoneLabel }}</p>
  </div>
</template>

<style scoped>
.milestone-card {
  background: var(--app-card-bg, #ffffff);
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: 10px;
  padding: 16px;
}

.milestone-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.milestone-icon {
  width: 18px;
  height: 18px;
  color: var(--app-teal, #47bfa9);
}

.milestone-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  margin: 0;
}

.milestone-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.milestone-bar {
  flex: 1;
  height: 8px;
  background: var(--app-bg, #f0f2f5);
  border-radius: 999px;
  overflow: hidden;
}

.milestone-fill {
  height: 100%;
  background: var(--app-teal, #47bfa9);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.milestone-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  min-width: 30px;
  text-align: right;
}

.milestone-label {
  font-size: 13px;
  color: var(--app-text-secondary, #64748b);
  margin: 0;
}
</style>
