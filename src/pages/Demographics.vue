<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDemographics } from "@/composables/useDemographics";
import { useRunData } from "@/composables/useRunData";
import { useBilling } from "@/composables/useBilling";
import DemoViewToggle from "@/components/demographics/DemoViewToggle.vue";
import DemoFilterBar from "@/components/demographics/DemoFilterBar.vue";
import DemoConfidenceBanner from "@/components/demographics/DemoConfidenceBanner.vue";
import DemoHeroCards from "@/components/demographics/DemoHeroCards.vue";
import DemoInsightsPanel from "@/components/demographics/DemoInsightsPanel.vue";
import DemoBarChart from "@/components/demographics/DemoBarChart.vue";
import DemoDoughnutChart from "@/components/demographics/DemoDoughnutChart.vue";
import DemoComparisonChart from "@/components/demographics/DemoComparisonChart.vue";
import DemoRecommendationsTable from "@/components/demographics/DemoRecommendationsTable.vue";
import PreviewUpgradeBanner from "@/components/billing/PreviewUpgradeBanner.vue";
import PaywallModal from "@/components/dashboard/PaywallModal.vue";
import PaymentFailedModal from "@/components/dashboard/PaymentFailedModal.vue";

const route = useRoute();
const router = useRouter();

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

const { runResult } = useRunData();

const {
  showPaywall,
  paywallBusy,
  showPaymentFailed,
  paymentFailedBusy,
  paywallConfig,
  isBillingOverlayActive,
  showBillingSuccess,
  onRequireSubscription,
  onPaywallPrimary,
  onPaywallSecondary,
  onPaymentFixPrimary,
  onPaymentFailedSecondary,
} = useBilling(route, router);

const isPreviewMode = ref(false);

watch(
  () => runResult.value,
  (result) => {
    if (result) {
      const previewMode = result.preview_mode === true;
      if (previewMode !== isPreviewMode.value) {
        isPreviewMode.value = previewMode;
        if (previewMode && !showPaywall.value) {
          onRequireSubscription();
        }
      }
    }
  },
  { immediate: true, deep: true }
);

const shouldBlur = computed(() => {
  return isBillingOverlayActive.value || (isPreviewMode.value && !showBillingSuccess.value);
});

const showPreviewUpgradeBanner = computed(() => {
  return isPreviewMode.value && !showBillingSuccess.value;
});
</script>

<template>
  <PreviewUpgradeBanner
    v-if="showPreviewUpgradeBanner"
    @select-plan="onRequireSubscription"
  />

  <div class="demo-page" :class="{ 'demo-blurred': shouldBlur }">
    <div class="page-header">
      <div>
        <p class="page-eyebrow">Audience</p>
        <h1>Who Converted</h1>
        <p>See who converted from your mailers and where to focus budget.</p>
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
        <DemoBarChart
          title="Home Age"
          :subtitle="view === 'matches' ? 'Estimated year-built profile of homes that converted' : 'Estimated year-built profile of customer homes'"
          :labels="charts.home_age?.labels ?? []"
          :values="charts.home_age?.values ?? []"
        />
      </div>

      <div
        class="chart-grid chart-grid-single"
        :class="{ 'charts-greyed': view === 'matches' && confidenceTier === 'insufficient' }"
        v-if="charts"
      >
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

  <PaywallModal
    v-model="showPaywall"
    :config="paywallConfig"
    :loading="paywallBusy"
    @primary="onPaywallPrimary"
    @secondary="onPaywallSecondary"
  />

  <PaymentFailedModal
    v-model="showPaymentFailed"
    :loading="paymentFailedBusy"
    title="Payment issue"
    message="We couldn't charge your card. Update your payment method to continue."
    primary-label="Fix payment"
    secondary-label="Not now"
    @primary="onPaymentFixPrimary"
    @secondary="onPaymentFailedSecondary"
  />
</template>

<style scoped>
.demo-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px 40px;
  transition: filter 0.18s ease, opacity 0.18s ease;
}

.demo-blurred {
  filter: blur(10px);
  opacity: 0.4;
  pointer-events: none;
  user-select: none;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.page-eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--pc-canary-deep, #e5b820);
}

.page-header h1 {
  margin: 0;
  font-family: var(--pc-font-display, "Oswald", sans-serif);
  font-size: clamp(26px, 3.5vw, 32px);
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--app-text, #1c2430);
}

.page-header p:not(.page-eyebrow) {
  color: var(--app-text-secondary, #5a6b7d);
  font-size: 14px;
  margin: 6px 0 0;
  font-weight: 400;
}

.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  transition: opacity 0.3s ease;
}

.chart-grid-single {
  grid-template-columns: 1fr;
}

.charts-greyed {
  opacity: 0.4;
  pointer-events: none;
}

.data-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 14px 18px;
  background: var(--app-card-bg, #f7f9fb);
  border: 1px solid var(--app-border, #c8d0db);
  border-radius: var(--app-card-radius, 2px);
  box-shadow: none;
}

.data-note svg {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--app-text-muted, #8a97a8);
}

.data-note p {
  margin: 0;
  font-size: 12px;
  color: var(--app-text-muted, #8a97a8);
  line-height: 1.5;
  font-weight: 400;
}

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
  color: var(--app-text-muted, #8a97a8);
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 2px solid var(--app-border, #c8d0db);
  border-top-color: var(--pc-canary, #facf41);
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
  color: var(--app-text-muted, #8a97a8) !important;
  margin-top: 8px;
  font-size: 13px !important;
}

.empty-state {
  text-align: center;
  padding: 48px 20px;
  border: 1px solid var(--app-border, #c8d0db);
  background: var(--app-card-bg, #f7f9fb);
  border-radius: var(--app-card-radius, 2px);
}

.empty-state h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text, #1c2430);
  margin: 0 0 8px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  color: var(--app-text-muted, #8a97a8);
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
