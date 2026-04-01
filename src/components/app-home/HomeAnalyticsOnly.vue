<!-- src/components/app-home/HomeAnalyticsOnly.vue -->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { captureEvent } from '@/composables/usePostHog'
import type { HomeUserContext } from '@/types/home'
import { MOCK_RECOMMENDATION, MOCK_COMMUNITY } from '@/types/home'
import { CloudUploadOutline, CheckmarkCircleOutline, ArrowForwardOutline } from '@vicons/ionicons5'

import RecommendationCard from './RecommendationCard.vue'
import CommunityProof from './CommunityProof.vue'

const props = defineProps<{
  context: HomeUserContext
}>()

const router = useRouter()

// Mock recent uploads for analytics-only users
const recentUploads = [
  { id: '1', name: 'March CRM Export', date: '2026-03-25', matchCount: 47 },
  { id: '2', name: 'February CRM Export', date: '2026-02-28', matchCount: 32 },
  { id: '3', name: 'January CRM Export', date: '2026-01-30', matchCount: 28 },
]

function onCrossSellClick() {
  captureEvent('home_cross_sell_clicked', {})
  router.push('/app/send')
}
</script>

<template>
  <div class="home-analytics">
    <!-- Analytics Summary -->
    <div class="summary-card">
      <h3 class="summary-title">Your Analytics Summary</h3>
      <div class="summary-stats">
        <div class="summary-stat">
          <span class="summary-stat-value">{{ context.batchCount }}</span>
          <span class="summary-stat-label">uploads</span>
        </div>
        <div class="summary-stat">
          <span class="summary-stat-value">107</span>
          <span class="summary-stat-label">total matches</span>
        </div>
        <div class="summary-stat">
          <span class="summary-stat-value">4.2%</span>
          <span class="summary-stat-label">avg match rate</span>
        </div>
      </div>
      <p class="summary-nudge">
        You've been tracking results. Now let PostCanary handle the mailing too.
      </p>
    </div>

    <!-- Recent Uploads -->
    <div class="section">
      <h3 class="section-title">Recent Uploads</h3>
      <div class="uploads-list">
        <div v-for="upload in recentUploads" :key="upload.id" class="upload-row">
          <div class="upload-info">
            <component :is="CloudUploadOutline" class="upload-icon" />
            <span class="upload-name">{{ upload.name }}</span>
          </div>
          <div class="upload-meta">
            <span class="upload-matches">
              <component :is="CheckmarkCircleOutline" class="upload-match-icon" />
              {{ upload.matchCount }} matches
            </span>
            <span class="upload-date">{{ new Date(upload.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Cross-Sell Card -->
    <div class="cross-sell-card">
      <h3 class="cross-sell-title">Send Postcards Through PostCanary</h3>
      <p class="cross-sell-desc">
        Skip the CSV exports. Design, target, and mail directly. We'll track everything automatically.
      </p>
      <ul class="cross-sell-benefits">
        <li>No more CSV exports</li>
        <li>Automatic tracking</li>
        <li>AI-powered targeting</li>
      </ul>
      <button class="cross-sell-cta" @click="onCrossSellClick" type="button">
        Send Your First Campaign
        <component :is="ArrowForwardOutline" class="cross-sell-cta-icon" />
      </button>
    </div>

    <!-- Recommendation -->
    <RecommendationCard :recommendation="MOCK_RECOMMENDATION" />

    <!-- Community Proof -->
    <CommunityProof :stats="MOCK_COMMUNITY" />
  </div>
</template>

<style scoped>
.home-analytics {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary-card {
  background: var(--app-card-bg, #ffffff);
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: 12px;
  padding: 24px;
}

.summary-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  margin: 0 0 16px;
}

.summary-stats {
  display: flex;
  gap: 32px;
  margin-bottom: 16px;
}

.summary-stat {
  display: flex;
  flex-direction: column;
}

.summary-stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--app-text, #0c2d50);
}

.summary-stat-label {
  font-size: 12px;
  color: var(--app-text-muted, #94a3b8);
  margin-top: 2px;
}

.summary-nudge {
  font-size: 14px;
  color: var(--app-text-secondary, #64748b);
  margin: 0;
  padding-top: 12px;
  border-top: 1px solid var(--app-border, #e2e8f0);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  margin: 0;
}

.uploads-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--app-border, #e2e8f0);
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: 10px;
  overflow: hidden;
}

.upload-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--app-card-bg, #ffffff);
}

.upload-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.upload-icon {
  width: 18px;
  height: 18px;
  color: var(--app-text-muted, #94a3b8);
}

.upload-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text, #0c2d50);
}

.upload-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.upload-matches {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--app-teal, #47bfa9);
  font-weight: 500;
}

.upload-match-icon {
  width: 14px;
  height: 14px;
}

.upload-date {
  font-size: 12px;
  color: var(--app-text-muted, #94a3b8);
}

.cross-sell-card {
  background: var(--app-card-bg, #ffffff);
  border: 2px solid var(--app-teal, #47bfa9);
  border-radius: 12px;
  padding: 24px;
}

.cross-sell-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  margin: 0 0 8px;
}

.cross-sell-desc {
  font-size: 14px;
  color: var(--app-text-body, #475569);
  margin: 0 0 12px;
  line-height: 1.5;
}

.cross-sell-benefits {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cross-sell-benefits li {
  font-size: 13px;
  color: var(--app-text-secondary, #64748b);
  padding-left: 20px;
  position: relative;
}

.cross-sell-benefits li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--app-teal, #47bfa9);
}

.cross-sell-cta {
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

.cross-sell-cta:hover {
  background: var(--app-teal-hover, #3aa893);
}

.cross-sell-cta-icon {
  width: 16px;
  height: 16px;
}
</style>
