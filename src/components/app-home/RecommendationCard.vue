<!-- src/components/app-home/RecommendationCard.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { BestPracticeRecommendation } from '@/types/home'
import { RocketOutline } from '@vicons/ionicons5'
import { captureEvent } from '@/composables/usePostHog'

const props = defineProps<{
  recommendation: BestPracticeRecommendation
}>()

const router = useRouter()

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

function startCampaign() {
  captureEvent('home_recommendation_clicked', { recommendationId: props.recommendation.id, goalType: props.recommendation.goalType })
  // S69: `from=recommendation` tells StepGoal to auto-advance to Step 2
  // after the goal is committed — the customer already expressed their
  // goal by clicking this card, no need to re-select on Step 1.
  router.push('/app/send?from=recommendation')
}

onMounted(() => {
  captureEvent('home_recommendation_viewed', { recommendationId: props.recommendation.id, goalType: props.recommendation.goalType })
})
</script>

<template>
  <div class="rec-card" :class="{ 'rec-card--high': recommendation.urgency === 'high' }">
    <div class="rec-header">
      <div class="rec-icon-wrap">
        <component :is="RocketOutline" class="rec-icon" />
      </div>
      <div>
        <span v-if="recommendation.seasonalTag" class="rec-tag">{{ recommendation.seasonalTag }}</span>
        <h3 class="rec-title">{{ recommendation.title }}</h3>
      </div>
    </div>

    <p class="rec-description">{{ recommendation.description }}</p>

    <div class="rec-why">
      <span class="rec-why-label">Why now:</span>
      {{ recommendation.why }}
    </div>

    <div class="rec-stats">
      <div class="rec-stat">
        <span class="rec-stat-value">~{{ recommendation.estimatedCount.toLocaleString() }}</span>
        <span class="rec-stat-label">households</span>
      </div>
      <div class="rec-stat">
        <span class="rec-stat-value">{{ formatCurrency(recommendation.estimatedCost) }}</span>
        <span class="rec-stat-label">estimated cost</span>
      </div>
    </div>

    <button class="rec-cta" @click="startCampaign" type="button">
      Start This Campaign
    </button>
  </div>
</template>

<style scoped>
.rec-card {
  background: var(--app-card-bg, #ffffff);
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: var(--app-card-radius, 12px);
  padding: 24px;
  box-shadow: var(--app-card-shadow);
}

.rec-card--high {
  border-color: var(--app-teal, #47bfa9);
  border-width: 2px;
}

.rec-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.rec-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(71, 191, 169, 0.1);
  flex-shrink: 0;
}

.rec-icon {
  width: 22px;
  height: 22px;
  color: var(--app-teal, #47bfa9);
}

.rec-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--app-teal, #47bfa9);
  background: rgba(71, 191, 169, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 4px;
}

.rec-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  margin: 0;
}

.rec-description {
  font-size: 14px;
  color: var(--app-text-body, #475569);
  line-height: 1.5;
  margin: 0 0 12px;
}

.rec-why {
  font-size: 13px;
  color: var(--app-text-secondary, #64748b);
  background: var(--app-bg, #f0f2f5);
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.rec-why-label {
  font-weight: 600;
  color: var(--app-text, #0c2d50);
}

.rec-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.rec-stat {
  display: flex;
  flex-direction: column;
}

.rec-stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--app-text, #0c2d50);
}

.rec-stat-label {
  font-size: 12px;
  color: var(--app-text-muted, #94a3b8);
}

.rec-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--app-teal, #47bfa9);
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.rec-cta:hover {
  background: var(--app-teal-hover, #3aa893);
}
</style>
