<!-- src/components/app-home/BudgetTracker.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { BudgetSummary } from '@/types/home'

const props = defineProps<{
  budget: BudgetSummary
}>()

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

const percentUsed = computed(() => {
  if (props.budget.monthlyBudget === 0) return 0
  return Math.min(100, Math.round((props.budget.spent / props.budget.monthlyBudget) * 100))
})

const remainingCampaigns = computed(() => {
  if (props.budget.nextRecommendedSpend === 0) return 0
  return Math.floor(props.budget.remaining / props.budget.nextRecommendedSpend)
})
</script>

<template>
  <div class="budget-card">
    <h4 class="budget-title">Monthly Budget</h4>
    <div class="budget-bar-wrap">
      <div class="budget-bar">
        <div class="budget-fill" :style="{ width: percentUsed + '%' }"></div>
      </div>
      <span class="budget-percent">{{ percentUsed }}%</span>
    </div>
    <p class="budget-text">
      {{ formatCurrency(budget.spent) }} of {{ formatCurrency(budget.monthlyBudget) }} spent this month
    </p>
    <p class="budget-remaining">
      {{ formatCurrency(budget.remaining) }} remaining
      <span v-if="remainingCampaigns > 0" class="budget-hint">
        · Enough for ~{{ remainingCampaigns }} more campaign{{ remainingCampaigns === 1 ? '' : 's' }}
      </span>
    </p>
  </div>
</template>

<style scoped>
.budget-card {
  background: var(--app-card-bg, #ffffff);
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: 10px;
  padding: 16px;
}

.budget-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  margin: 0 0 10px;
}

.budget-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.budget-bar {
  flex: 1;
  height: 8px;
  background: var(--app-bg, #f0f2f5);
  border-radius: 999px;
  overflow: hidden;
}

.budget-fill {
  height: 100%;
  background: var(--app-teal, #47bfa9);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.budget-percent {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  min-width: 36px;
  text-align: right;
}

.budget-text {
  font-size: 13px;
  color: var(--app-text-secondary, #64748b);
  margin: 0 0 2px;
}

.budget-remaining {
  font-size: 13px;
  color: var(--app-text, #0c2d50);
  font-weight: 500;
  margin: 0;
}

.budget-hint {
  color: var(--app-text-muted, #94a3b8);
  font-weight: 400;
}
</style>
