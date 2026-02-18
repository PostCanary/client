<script setup lang="ts">
import { computed } from "vue";
import { useAnalytics } from "@/composables/useAnalytics";
import { useRunData } from "@/composables/useRunData";
import AnalyticsHeroCards from "@/components/analytics/AnalyticsHeroCards.vue";
import InsightsSummary from "@/components/analytics/InsightsSummary.vue";
import InsightSectionCard from "@/components/analytics/InsightSection.vue";
import RecommendationsPanel from "@/components/analytics/RecommendationsPanel.vue";
import RegenerateButton from "@/components/analytics/RegenerateButton.vue";

const {
  loading,
  regenerating,
  error,
  hasData,
  executiveSummary,
  sections,
  recommendations,
  generatedAt,
  dataContext,
  regenerate,
} = useAnalytics();

const { runResult } = useRunData();

const kpis = computed(() => (runResult.value as any)?.kpis ?? null);
</script>

<template>
  <div class="analytics-page">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1>AI Insights</h1>
        <p>AI-powered insights from your mail and CRM data</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !hasData" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading analytics...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <p class="error-hint">Make sure you have completed at least one matching run.</p>
    </div>

    <!-- Generating State (user clicked Generate) -->
    <div v-else-if="regenerating && !hasData" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Generating AI insights... this may take a moment.</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!hasData && !loading" class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <h2>No analytics available yet</h2>
      <p>Generate AI-powered insights from your existing match data.</p>
      <div v-if="kpis" class="empty-data-summary">
        Your data: {{ kpis.total_matches ?? 0 }} matches | {{ kpis.total_mail ?? 0 }} mailers | {{ kpis.median_days_to_convert ?? '–' }} median days to convert
      </div>
      <button
        class="generate-btn"
        :disabled="regenerating"
        @click="regenerate"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        Generate Insights
      </button>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Hero KPI Cards -->
      <AnalyticsHeroCards :kpis="kpis" />

      <!-- AI Executive Summary -->
      <InsightsSummary
        :summary="executiveSummary"
        :generated-at="generatedAt"
        :data-context="dataContext"
      />

      <!-- Insight Sections -->
      <div class="sections-grid">
        <InsightSectionCard
          v-for="(section, i) in sections"
          :key="i"
          :section="section"
        />
      </div>

      <!-- Recommendations -->
      <RecommendationsPanel :recommendations="recommendations" />

      <!-- Regenerate Button -->
      <RegenerateButton
        :regenerating="regenerating"
        @regenerate="regenerate"
      />
    </template>
  </div>
</template>

<style scoped>
.analytics-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px 40px;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--app-text, #0c2d50);
}

.page-header p {
  color: var(--app-text-secondary, #64748b);
  font-size: 13px;
  margin-top: 2px;
  font-weight: 400;
}

/* Sections Grid */
.sections-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
}

.loading-state p {
  font-size: 14px;
  color: var(--app-text-muted, #94a3b8);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--app-border, #e2e8f0);
  border-top-color: var(--app-teal, #47bfa9);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  text-align: center;
  padding: 60px 20px;
}

.error-state p {
  font-size: 14px;
  color: #ef4444;
}

.error-hint {
  color: var(--app-text-muted, #94a3b8) !important;
  margin-top: 8px;
  font-size: 13px !important;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  color: var(--app-text-muted, #94a3b8);
  margin-bottom: 16px;
}

.empty-state h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
  color: var(--app-text-muted, #94a3b8);
}

.empty-data-summary {
  font-size: 13px;
  color: var(--app-text-secondary, #64748b);
  margin-top: 12px;
  padding: 8px 16px;
  background: rgba(71, 191, 169, 0.06);
  border-radius: 8px;
  display: inline-block;
}

.generate-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 12px 24px;
  border-radius: 999px;
  border: none;
  background: var(--app-teal, #47bfa9);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.generate-btn:hover:not(:disabled) {
  background: #3da897;
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 1024px) {
  .sections-grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
