<!-- src/components/app-home/QuickActions.vue -->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { QuickAction } from '@/types/home'
import {
  MailOutline,
  BarChartOutline,
  CloudUploadOutline,
  ColorPaletteOutline,
} from '@vicons/ionicons5'

const props = defineProps<{
  actions: QuickAction[]
}>()

const router = useRouter()

const iconMap: Record<string, any> = {
  MailOutline,
  BarChartOutline,
  CloudUploadOutline,
  ColorPaletteOutline,
}
</script>

<template>
  <div class="quick-actions">
    <button
      v-for="action in actions"
      :key="action.id"
      class="qa-card"
      :class="{ 'qa-card--primary': action.variant === 'primary' }"
      @click="router.push(action.route)"
      type="button"
    >
      <component
        :is="iconMap[action.icon]"
        class="qa-icon"
      />
      <span class="qa-label">{{ action.label }}</span>
      <span class="qa-desc">{{ action.description }}</span>
    </button>
  </div>
</template>

<style scoped>
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.qa-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  background: var(--app-card-bg, #ffffff);
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: 10px;
  cursor: pointer;
  text-align: center;
  transition: background 0.12s ease, box-shadow 0.12s ease;
}

.qa-card:hover {
  background: var(--app-bg, #f0f2f5);
  box-shadow: 0 2px 8px rgba(12, 45, 80, 0.06);
}

.qa-card--primary {
  background: var(--app-teal, #47bfa9);
  border-color: var(--app-teal, #47bfa9);
  color: #ffffff;
}

.qa-card--primary:hover {
  background: var(--app-teal-hover, #3aa893);
}

.qa-card--primary .qa-icon {
  color: #ffffff;
}

.qa-card--primary .qa-label {
  color: #ffffff;
}

.qa-card--primary .qa-desc {
  color: rgba(255, 255, 255, 0.8);
}

.qa-icon {
  width: 24px;
  height: 24px;
  color: var(--app-teal, #47bfa9);
}

.qa-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
}

.qa-desc {
  font-size: 12px;
  color: var(--app-text-muted, #94a3b8);
}
</style>
