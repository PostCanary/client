<!-- src/components/app-home/GettingStartedChecklist.vue -->
<script setup lang="ts">
import type { Component } from 'vue'
import { useRouter } from 'vue-router'
import { captureEvent } from '@/composables/usePostHog'
import type { ChecklistStep } from '@/types/home'
import {
  BusinessOutline,
  MailOutline,
  CloudUploadOutline,
  CheckmarkCircleOutline,
  CheckmarkCircle,
} from '@vicons/ionicons5'

const props = defineProps<{
  steps: ChecklistStep[]
}>()

const router = useRouter()

const iconMap: Record<string, Component> = {
  BusinessOutline,
  MailOutline,
  CloudUploadOutline,
  CheckmarkCircleOutline,
}

function onStepClick(step: ChecklistStep) {
  if (step.completed || !step.actionRoute) return
  captureEvent('home_getting_started_step_clicked', { stepId: step.id })
  router.push(step.actionRoute)
}

function isCurrent(step: ChecklistStep, index: number): boolean {
  if (step.completed) return false
  const firstIncompleteIndex = props.steps.findIndex(s => !s.completed)
  return index === firstIncompleteIndex
}
</script>

<template>
  <div class="checklist">
    <div
      v-for="(step, index) in steps"
      :key="step.id"
      class="checklist-step"
      :class="{
        'checklist-step--completed': step.completed,
        'checklist-step--current': isCurrent(step, index),
        'checklist-step--future': !step.completed && !isCurrent(step, index),
      }"
    >
      <!-- Connecting line between steps -->
      <div class="checklist-connector">
        <div class="checklist-dot">
          <component v-if="step.completed" :is="CheckmarkCircle" class="checklist-check-icon" />
          <span v-else class="checklist-step-number">{{ index + 1 }}</span>
        </div>
        <div v-if="index < steps.length - 1" class="checklist-line"></div>
      </div>

      <!-- Step content -->
      <div class="checklist-content">
        <div class="checklist-header">
          <div class="checklist-info">
            <component :is="iconMap[step.icon] || CheckmarkCircleOutline" class="checklist-icon" />
            <div>
              <h4 class="checklist-label">{{ step.label }}</h4>
              <p class="checklist-desc">{{ step.description }}</p>
            </div>
          </div>
          <span class="checklist-time">{{ step.timeEstimate }}</span>
        </div>

        <button
          v-if="isCurrent(step, index)"
          class="checklist-cta"
          @click="onStepClick(step)"
          type="button"
        >
          {{ step.actionLabel }}
        </button>
        <span v-else-if="step.completed" class="checklist-done-label">Done</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checklist {
  display: flex;
  flex-direction: column;
}

.checklist-step {
  display: flex;
  gap: 16px;
  position: relative;
}

.checklist-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 32px;
}

.checklist-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--app-bg, #f0f2f5);
  border: 2px solid var(--app-border, #e2e8f0);
  flex-shrink: 0;
  z-index: 1;
}

.checklist-step--completed .checklist-dot {
  background: var(--app-teal, #47bfa9);
  border-color: var(--app-teal, #47bfa9);
}

.checklist-step--current .checklist-dot {
  border-color: var(--app-teal, #47bfa9);
  background: #ffffff;
}

.checklist-check-icon {
  width: 20px;
  height: 20px;
  color: #ffffff;
}

.checklist-step-number {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-muted, #94a3b8);
}

.checklist-step--current .checklist-step-number {
  color: var(--app-teal, #47bfa9);
}

.checklist-line {
  width: 2px;
  flex: 1;
  min-height: 16px;
  background: var(--app-border, #e2e8f0);
}

.checklist-step--completed .checklist-line {
  background: var(--app-teal, #47bfa9);
}

.checklist-content {
  flex: 1;
  background: var(--app-card-bg, #ffffff);
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 4px;
}

.checklist-step--current .checklist-content {
  border-color: var(--app-teal, #47bfa9);
  box-shadow: 0 0 0 1px rgba(71, 191, 169, 0.1);
}

.checklist-step--future .checklist-content {
  opacity: 0.6;
}

.checklist-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.checklist-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.checklist-icon {
  width: 20px;
  height: 20px;
  color: var(--app-teal, #47bfa9);
  flex-shrink: 0;
  margin-top: 2px;
}

.checklist-step--completed .checklist-icon {
  color: var(--app-text-muted, #94a3b8);
}

.checklist-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  margin: 0;
}

.checklist-step--completed .checklist-label {
  text-decoration: line-through;
  color: var(--app-text-muted, #94a3b8);
}

.checklist-desc {
  font-size: 13px;
  color: var(--app-text-secondary, #64748b);
  margin: 2px 0 0;
  line-height: 1.4;
}

.checklist-time {
  font-size: 12px;
  color: var(--app-text-muted, #94a3b8);
  white-space: nowrap;
  flex-shrink: 0;
}

.checklist-cta {
  display: inline-flex;
  align-items: center;
  margin-top: 12px;
  padding: 8px 16px;
  background: var(--app-teal, #47bfa9);
  color: #ffffff;
  font-weight: 600;
  font-size: 13px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.checklist-cta:hover {
  background: var(--app-teal-hover, #3aa893);
}

.checklist-done-label {
  display: inline-block;
  margin-top: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--app-teal, #47bfa9);
}
</style>
