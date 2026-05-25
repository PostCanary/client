<!-- src/components/app-home/HomeReturning.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { HomeUserContext } from '@/types/home'
import {
  MOCK_RECOMMENDATION,
  MOCK_CAMPAIGNS,
  MOCK_BUDGET,
  MOCK_MILESTONE,
  MOCK_COMMUNITY,
  MOCK_FIRST_RESULT,
  MOCK_QUICK_ACTIONS,
} from '@/types/home'

import RecommendationCard from './RecommendationCard.vue'
import QuickActions from './QuickActions.vue'
import ActiveCampaignCard from './ActiveCampaignCard.vue'
import BudgetTracker from './BudgetTracker.vue'
import CommunityProof from './CommunityProof.vue'
import MilestoneTracker from './MilestoneTracker.vue'
import FirstResultCelebration from './FirstResultCelebration.vue'

const props = defineProps<{
  context: HomeUserContext
}>()

const router = useRouter()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})

// Show first result celebration if first result is < 7 days old
const showCelebration = computed(() => {
  if (!props.context.hasFirstResult) return false
  const detected = new Date(MOCK_FIRST_RESULT.detectedDate)
  const now = new Date()
  const daysSince = Math.floor((now.getTime() - detected.getTime()) / (1000 * 60 * 60 * 24))
  return daysSince < 7
})

// Show max 3 active campaigns
const visibleCampaigns = computed(() => MOCK_CAMPAIGNS.slice(0, 5))
const hasMoreCampaigns = computed(() => MOCK_CAMPAIGNS.length > 5)
</script>

<template>
  <div class="home-returning">
    <!-- Greeting -->
    <div class="greeting">
      <h1 class="greeting-title">{{ greeting }}, {{ context.firstName }}</h1>
      <p class="greeting-subtitle">Here's what's happening with your campaigns.</p>
    </div>

    <!-- First Result Celebration (conditional) -->
    <FirstResultCelebration v-if="showCelebration" :result="MOCK_FIRST_RESULT" />

    <!-- Recommendation -->
    <RecommendationCard :recommendation="MOCK_RECOMMENDATION" />

    <!-- Quick Actions -->
    <QuickActions :actions="MOCK_QUICK_ACTIONS" />

    <!-- Active Campaigns -->
    <div v-if="visibleCampaigns.length > 0" class="section">
      <div class="section-header">
        <h3 class="section-title">Active Campaigns</h3>
        <button
          v-if="hasMoreCampaigns"
          class="section-link"
          @click="router.push('/app/campaigns')"
          type="button"
        >
          View all
        </button>
      </div>
      <div class="campaigns-list">
        <ActiveCampaignCard
          v-for="campaign in visibleCampaigns"
          :key="campaign.id"
          :campaign="campaign"
        />
      </div>
    </div>

    <!-- Budget Tracker -->
    <BudgetTracker v-if="context.hasBudgetSet" :budget="MOCK_BUDGET" />

    <!-- Recent Results Summary -->
    <div class="results-summary">
      <div class="results-header">
        <h4 class="results-title">Recent Results</h4>
        <button class="section-link" @click="router.push('/app/dashboard')" type="button">
          View full dashboard
        </button>
      </div>
      <p class="results-text">
        <strong>{{ MOCK_FIRST_RESULT.matchCount }}</strong> attributed matches this month
        · Best performing: <strong>{{ MOCK_CAMPAIGNS[0]?.name || 'N/A' }}</strong>
      </p>
    </div>

    <!-- Community Proof -->
    <CommunityProof :stats="MOCK_COMMUNITY" />

    <!-- Milestone Tracker -->
    <MilestoneTracker :milestone="MOCK_MILESTONE" />
  </div>
</template>

<style scoped>
.home-returning {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.greeting-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--app-text, #0c2d50);
  margin: 0;
}

.greeting-subtitle {
  font-size: 14px;
  color: var(--app-text-secondary, #64748b);
  margin: 4px 0 0;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  margin: 0;
}

.section-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--app-teal, #47bfa9);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.section-link:hover {
  text-decoration: underline;
}

.campaigns-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.results-summary {
  background: var(--app-card-bg, #ffffff);
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: 10px;
  padding: 16px;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.results-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  margin: 0;
}

.results-text {
  font-size: 13px;
  color: var(--app-text-secondary, #64748b);
  margin: 0;
}

.results-text strong {
  color: var(--app-text, #0c2d50);
}
</style>
