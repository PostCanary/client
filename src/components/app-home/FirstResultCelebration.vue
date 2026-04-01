<!-- src/components/app-home/FirstResultCelebration.vue -->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { FirstResultData } from '@/types/home'
import { CheckmarkCircleOutline } from '@vicons/ionicons5'
import { onMounted } from 'vue'
import { captureEvent } from '@/composables/usePostHog'

const props = defineProps<{
  result: FirstResultData
}>()

const router = useRouter()

onMounted(() => {
  captureEvent('home_first_result_celebration_seen', { campaignName: props.result.campaignName })
})
</script>

<template>
  <div class="celebration-card">
    <div class="celebration-header">
      <component :is="CheckmarkCircleOutline" class="celebration-icon" />
      <h4 class="celebration-title">Your first campaign result is in!</h4>
    </div>
    <p class="celebration-text">
      {{ result.matchCount }} match{{ result.matchCount === 1 ? '' : 'es' }} from <strong>{{ result.campaignName }}</strong>
    </p>
    <button class="celebration-cta" @click="router.push('/app/dashboard')" type="button">
      See your results
    </button>
  </div>
</template>

<style scoped>
.celebration-card {
  background: var(--app-card-bg, #ffffff);
  border: 2px solid var(--app-teal, #47bfa9);
  border-radius: 10px;
  padding: 16px;
}

.celebration-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.celebration-icon {
  width: 22px;
  height: 22px;
  color: var(--app-teal, #47bfa9);
}

.celebration-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  margin: 0;
}

.celebration-text {
  font-size: 14px;
  color: var(--app-text-body, #475569);
  margin: 0 0 12px;
}

.celebration-text strong {
  color: var(--app-text, #0c2d50);
}

.celebration-cta {
  display: inline-flex;
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

.celebration-cta:hover {
  background: var(--app-teal-hover, #3aa893);
}
</style>
