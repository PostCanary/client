<script setup lang="ts">
import { useDemographics } from "@/composables/useDemographics";
import DemoViewToggle from "@/components/demographics/DemoViewToggle.vue";
import DemoFilterBar from "@/components/demographics/DemoFilterBar.vue";
import DemoConfidenceBanner from "@/components/demographics/DemoConfidenceBanner.vue";
import DemoHeroCards from "@/components/demographics/DemoHeroCards.vue";
import DemoInsightsPanel from "@/components/demographics/DemoInsightsPanel.vue";
import DemoBarChart from "@/components/demographics/DemoBarChart.vue";
import DemoDoughnutChart from "@/components/demographics/DemoDoughnutChart.vue";
import DemoComparisonChart from "@/components/demographics/DemoComparisonChart.vue";
import DemoRecommendationsTable from "@/components/demographics/DemoRecommendationsTable.vue";

const {
  view,
  start,
  end,
  loading,
  error,
  hero,
  charts,
  insightMessage,
  recommendations,
  dataNote,
  matchCount,
  confidenceTier,
  hasData,
} = useDemographics();
</script>

<template>
  <div class="demo-page">
    <!-- Page Header + View Toggle -->
    <div class="page-header">
      <div>
        <h1>Demographic Insights</h1>
        <p>See who's converting from your mailers and where to focus your budget</p>
      </div>
      <DemoViewToggle v-model="view" />
    </div>

    <!-- Filter Bar -->
    <DemoFilterBar
      :start="start"
      :end="end"
      @update:start="start = $event"
      @update:end="end = $event"
    />

    <!-- Loading State -->
    <div v-if="loading && !hasData" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading demographic data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <p class="error-hint">Make sure you have uploaded mailer and CRM data with ZIP codes.</p>
    </div>

    <!-- Zero Matches (Matches tab only) -->
    <div v-else-if="view === 'matches' && hasData && matchCount === 0" class="empty-state">
      <h2>No matching addresses found</h2>
      <p>No matching addresses found between your mail and CRM files. Make sure both files contain the same address format.</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!hasData && !loading" class="empty-state">
      <h2>No demographic data available</h2>
      <p>Upload your mailer and CRM data to see demographic insights about who's converting.</p>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Confidence Banner (Matches tab only) -->
      <DemoConfidenceBanner
        v-if="view === 'matches'"
        :tier="confidenceTier"
        :match-count="matchCount"
      />

      <!-- Hero KPI Cards -->
      <DemoHeroCards :hero="hero" :view="view" :confidence-tier="confidenceTier" />

      <!-- Insights Panel (Matches tab only) -->
      <DemoInsightsPanel
        v-if="view === 'matches'"
        :message="insightMessage"
        :tier="confidenceTier"
      />

      <!-- Charts -->
      <div
        class="chart-grid"
        :class="{ 'charts-greyed': view === 'matches' && confidenceTier === 'insufficient' }"
        v-if="charts"
      >
        <DemoBarChart
          title="Home Value"
          :subtitle="view === 'matches' ? 'Estimated value of homes that converted' : 'Estimated value of customer homes'"
          :labels="charts.home_value?.labels ?? []"
          :values="charts.home_value?.values ?? []"
        />
        <DemoBarChart
          title="Age Range"
          :subtitle="view === 'matches' ? 'Estimated age of homeowners who converted' : 'Estimated age of customer homeowners'"
          :labels="charts.age_range?.labels ?? []"
          :values="charts.age_range?.values ?? []"
        />
      </div>

      <div
        class="chart-grid"
        :class="{ 'charts-greyed': view === 'matches' && confidenceTier === 'insufficient' }"
        v-if="charts"
      >
        <DemoBarChart
          title="Household Income"
          :subtitle="view === 'matches' ? 'Estimated income of households that converted' : 'Estimated income of customer households'"
          :labels="charts.income?.labels ?? []"
          :values="charts.income?.values ?? []"
        />
        <DemoDoughnutChart
          title="Property Type"
          :subtitle="view === 'matches' ? 'Type of property that converted' : 'Type of customer property'"
          :labels="charts.property_type?.labels ?? []"
          :values="charts.property_type?.values ?? []"
        />
      </div>

      <!-- Comparison Chart (Matches tab only) -->
      <DemoComparisonChart
        v-if="view === 'matches' && charts?.comparison"
        :labels="charts.comparison.labels"
        :mailed="charts.comparison.mailed"
        :matched="charts.comparison.matched"
      />

      <!-- Recommendations Table (Matches tab only) -->
      <DemoRecommendationsTable
        v-if="view === 'matches'"
        :recommendations="recommendations"
        :confidence-tier="confidenceTier"
      />

      <!-- Data Source Note -->
      <div class="data-note" v-if="dataNote">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p>{{ dataNote }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.demo-page {
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

/* Chart Grid */
.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  transition: opacity 0.3s ease;
}

.charts-greyed {
  opacity: 0.4;
  pointer-events: none;
}

/* Data Note */
.data-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 14px 20px;
  background: var(--app-card-bg, #fff);
  border-radius: var(--app-card-radius, 12px);
  box-shadow: var(--app-card-shadow);
}

.data-note svg {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--app-text-muted, #94a3b8);
}

.data-note p {
  font-size: 12px;
  color: var(--app-text-muted, #94a3b8);
  line-height: 1.5;
  font-weight: 400;
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

/* Responsive */
@media (max-width: 1024px) {
  .chart-grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
