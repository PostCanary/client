<!-- src/components/app-home/HomeNew.vue -->
<script setup lang="ts">
import type { HomeUserContext } from '@/types/home'
import { MOCK_RECOMMENDATION, MOCK_CHECKLIST, MOCK_COMMUNITY } from '@/types/home'

import GettingStartedChecklist from './GettingStartedChecklist.vue'
import RecommendationCard from './RecommendationCard.vue'
import CommunityProof from './CommunityProof.vue'

defineProps<{
  context: HomeUserContext
}>()

// Override recommendation framing for new users
const newUserRecommendation = {
  ...MOCK_RECOMMENDATION,
  title: 'Your Recommended First Campaign',
  description: `Based on what works for HVAC businesses in spring — your past customers are prime targets for tune-ups before the heat hits. Neighbor marketing around recent jobs gets you the highest ROI.`,
}
</script>

<template>
  <div class="home-new">
    <!-- Welcome -->
    <div class="welcome welcome--new">
      <div class="welcome-badge">Getting Started</div>
      <h1 class="welcome-title">Welcome to PostCanary, {{ context.firstName }}!</h1>
      <p class="welcome-subtitle">
        Let's get your first postcards in the mail. Most businesses see results within 2 weeks.
      </p>
    </div>

    <!-- Getting Started Checklist -->
    <div class="section">
      <h3 class="section-title">Get Started</h3>
      <GettingStartedChecklist :steps="MOCK_CHECKLIST" />
    </div>

    <!-- Recommendation -->
    <RecommendationCard :recommendation="newUserRecommendation" />

    <!-- Community Proof -->
    <div class="community-wrap">
      <p class="join-text">Join <strong>{{ MOCK_COMMUNITY.activeBusinesses }}+</strong> businesses already using PostCanary</p>
      <CommunityProof :stats="MOCK_COMMUNITY" />
    </div>
  </div>
</template>

<style scoped>
.home-new {
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

.welcome--new {
  background: var(--app-card-bg, #ffffff);
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: 12px;
  padding: 24px;
  border-top: 4px solid var(--app-teal, #47bfa9);
}

.welcome-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-teal, #47bfa9);
  background: rgba(71, 191, 169, 0.1);
  padding: 3px 10px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.welcome-subtitle {
  font-size: 14px;
  color: var(--app-text-secondary, #64748b);
  margin: 4px 0 0;
  line-height: 1.5;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  margin: 0;
}

.community-wrap {
  margin-top: 4px;
}

.join-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text-secondary, #64748b);
  margin: 0 0 8px;
}

.join-text strong {
  color: var(--app-text, #0c2d50);
  font-weight: 600;
}
</style>
