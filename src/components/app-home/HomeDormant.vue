<!-- src/components/app-home/HomeDormant.vue -->
<script setup lang="ts">
import type { HomeUserContext } from '@/types/home'
import {
  MOCK_RECOMMENDATION,
  MOCK_QUICK_ACTIONS,
  MOCK_COMMUNITY,
} from '@/types/home'
import { TimeOutline, TrendingUpOutline, CalendarOutline } from '@vicons/ionicons5'

import RecommendationCard from './RecommendationCard.vue'
import QuickActions from './QuickActions.vue'
import CommunityProof from './CommunityProof.vue'

const props = defineProps<{
  context: HomeUserContext
}>()

// Override recommendation with high urgency for dormant users
const urgentRecommendation = {
  ...MOCK_RECOMMENDATION,
  urgency: 'high' as const,
  why: `You haven't mailed in ${props.context.daysSinceLastActivity} days. Your competitors mailed 1,200 postcards in your area last month. Spring cooling season starts in 3 weeks.`,
}
</script>

<template>
  <div class="home-dormant">
    <!-- Welcome Back -->
    <div class="welcome-back">
      <h1 class="welcome-title">Welcome back, {{ context.firstName }}!</h1>
      <p class="welcome-subtitle">
        It's been {{ context.daysSinceLastActivity }} days since your last campaign.
        Your competitors haven't stopped mailing.
      </p>
    </div>

    <!-- What You Missed -->
    <div class="missed-card">
      <h3 class="missed-title">Since you've been away</h3>
      <div class="missed-items">
        <div class="missed-item">
          <component :is="TrendingUpOutline" class="missed-icon" />
          <span class="missed-text">
            <strong>84</strong> new households moved into your service area
          </span>
        </div>
        <div class="missed-item">
          <component :is="CalendarOutline" class="missed-icon" />
          <span class="missed-text">
            Seasonal window for <strong>spring AC tune-ups</strong> opens in 3 weeks
          </span>
        </div>
        <div class="missed-item">
          <component :is="TimeOutline" class="missed-icon" />
          <span class="missed-text">
            Your competitors mailed <strong>1,200 postcards</strong> in your area
          </span>
        </div>
      </div>
    </div>

    <!-- Urgent Recommendation -->
    <RecommendationCard :recommendation="urgentRecommendation" />

    <!-- Quick Actions -->
    <QuickActions :actions="MOCK_QUICK_ACTIONS" />

    <!-- Community Proof -->
    <CommunityProof :stats="MOCK_COMMUNITY" />
  </div>
</template>

<style scoped>
.home-dormant {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--app-text, #0c2d50);
  margin: 0;
}

.welcome-subtitle {
  font-size: 14px;
  color: var(--app-text-secondary, #64748b);
  margin: 4px 0 0;
  line-height: 1.5;
}

.missed-card {
  background: var(--app-card-bg, #ffffff);
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: 12px;
  padding: 20px;
}

.missed-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  margin: 0 0 14px;
}

.missed-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.missed-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.missed-icon {
  width: 18px;
  height: 18px;
  color: var(--app-teal, #47bfa9);
  flex-shrink: 0;
  margin-top: 1px;
}

.missed-text {
  font-size: 14px;
  color: var(--app-text-body, #475569);
  line-height: 1.4;
}

.missed-text strong {
  color: var(--app-text, #0c2d50);
  font-weight: 600;
}
</style>
