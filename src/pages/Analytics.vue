<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAnalytics } from "@/composables/useAnalytics";
import { useUploadAndMatch } from "@/composables/useUploadAndMatch";

import UploadCard from "@/components/dashboard/UploadCard.vue";
import MatchStrip from "@/components/dashboard/MatchStrip.vue";
import KpiSummaryCard from "@/components/dashboard/KpiSummaryCard.vue";
import MappingRequiredModal from "@/components/dashboard/MappingRequiredModal.vue";
import MapperModal from "@/components/dashboard/MapperModal.vue";
import CampaignPromptModal from "@/components/dashboard/CampaignPromptModal.vue";
import FirstUploadRunMatchingModal from "@/components/dashboard/FirstUploadRunMatchingModal.vue";
import PaywallModal from "@/components/dashboard/PaywallModal.vue";
import PaymentFailedModal from "@/components/dashboard/PaymentFailedModal.vue";
import PreviewUpgradeBanner from "@/components/billing/PreviewUpgradeBanner.vue";

import InsightsSummary from "@/components/analytics/InsightsSummary.vue";
import InsightSectionCard from "@/components/analytics/InsightSection.vue";
import RecommendationsPanel from "@/components/analytics/RecommendationsPanel.vue";
import RegenerateButton from "@/components/analytics/RegenerateButton.vue";

const route = useRoute();
const router = useRouter();

const {
  loading: analyticsLoading,
  regenerating,
  error: analyticsError,
  hasData: hasInsightsData,
  executiveSummary,
  sections,
  recommendations,
  generatedAt,
  dataContext,
  regenerate,
} = useAnalytics();

const {
  runResult,
  runResultLoading,
  runDataError,
  hasMatchData,
  initialLoadDone,

  showMapping,
  missing,
  mappingBlocked,
  showMapper,
  mailHeaders,
  crmHeaders,
  mailHeaderTypes,
  crmHeaderTypes,
  mailSamples,
  crmSamples,
  requiredMail,
  requiredCrm,
  initialMapping,
  mailFields,
  crmFields,
  mailLabels,
  crmLabels,
  mapperErrors,
  mapperSaving,
  uploadResetKey,
  showFirstUploadModal,
  firstUploadRunLoading,
  showCampaignPrompt,
  pendingNormalize,
  billingReadOnly,

  onBatchIdsUpdated,
  onUploadMappingRequired,
  onUploadCommit,
  openMapper,
  onMappingConfirm,
  onCampaignPromptConfirm,
  onCampaignPromptSkip,
  handleFirstUploadRunMatching,

  showPaywall,
  paywallBusy,
  showPaymentFailed,
  paymentFailedBusy,
  effectivePaywallConfig,
  shouldBlur,
  showPreviewUpgradeBanner,
  onRequireSubscription,
  onPaywallPrimary,
  handlePaywallSecondary,
  onPaymentFixPrimary,
  onPaymentFailedSecondary,
} = useUploadAndMatch(route, router);

const kpis = computed(() => (runResult.value as any)?.kpis ?? null);

/** Entry screen until first refresh finishes, then only when no match KPIs yet. */
const showEntryScreen = computed(
  () => initialLoadDone.value && !hasMatchData.value,
);

const showResultsScreen = computed(() => hasMatchData.value);
</script>

<template>
  <PreviewUpgradeBanner
    v-if="showPreviewUpgradeBanner"
    @select-plan="onRequireSubscription"
  />

  <div class="analytics-page" :class="{ 'analytics-blurred': shouldBlur }">
    <!-- Initial load -->
    <div v-if="!initialLoadDone && runResultLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading analytics...</p>
    </div>

    <!-- Screen 1 — Entry: upload customer list -->
    <div v-else-if="showEntryScreen" class="entry-screen">
      <div class="entry-header">
        <p class="entry-eyebrow">Analysis</p>
        <h1>Prove who converted</h1>
        <p>Upload mail and CRM CSVs to see matched revenue and AI insights.</p>
      </div>

      <div class="entry-upload">
        <UploadCard
          :reset-key="uploadResetKey"
          :mapping-blocked="mappingBlocked"
          :billing-blocked="billingReadOnly"
          @edit-mapping="openMapper"
          @batch-ids="onBatchIdsUpdated"
          @upload-commit="onUploadCommit"
          @mapping-required="onUploadMappingRequired"
        />
      </div>
    </div>

    <!-- Screen 2 — Results: Match Strip + re-upload + AI Insights -->
    <template v-else-if="showResultsScreen">
      <div v-if="runDataError" class="run-error">
        {{ runDataError }}
      </div>

      <MatchStrip
        :kpis="kpis"
        :loading="runResultLoading"
      />

      <!-- Re-upload + volume context (mirrors Dashboard) -->
      <div class="action-row">
        <UploadCard
          :reset-key="uploadResetKey"
          :mapping-blocked="mappingBlocked"
          :billing-blocked="billingReadOnly"
          @edit-mapping="openMapper"
          @batch-ids="onBatchIdsUpdated"
          @upload-commit="onUploadCommit"
          @mapping-required="onUploadMappingRequired"
        />

        <KpiSummaryCard
          variant="advanced"
          :kpis="kpis"
          :loading="runResultLoading"
        />
      </div>

      <!-- AI Insights (preserved; only when insights exist) -->
      <section v-if="hasInsightsData" class="ai-insights-section">
        <div class="page-header">
          <div>
            <h2 class="ai-insights-heading">AI Insights</h2>
            <p>Patterns from your matched mail and CRM data</p>
          </div>
        </div>

        <InsightsSummary
          :summary="executiveSummary"
          :generated-at="generatedAt"
          :data-context="dataContext"
        />

        <div class="sections-grid">
          <InsightSectionCard
            v-for="(section, i) in sections"
            :key="i"
            :section="section"
          />
        </div>

        <RecommendationsPanel :recommendations="recommendations" />

        <RegenerateButton
          :regenerating="regenerating"
          @regenerate="regenerate"
        />
      </section>

      <!-- Insights loading / empty / error under results when match data exists -->
      <section
        v-else-if="analyticsLoading && !hasInsightsData"
        class="ai-insights-section"
      >
        <h2 class="ai-insights-heading">AI Insights</h2>
        <div class="loading-state compact">
          <div class="loading-spinner"></div>
          <p>Loading AI insights...</p>
        </div>
      </section>

      <section
        v-else-if="regenerating && !hasInsightsData"
        class="ai-insights-section"
      >
        <h2 class="ai-insights-heading">AI Insights</h2>
        <div class="loading-state compact">
          <div class="loading-spinner"></div>
          <p>Generating AI insights... this may take a moment.</p>
        </div>
      </section>

      <section v-else-if="analyticsError" class="ai-insights-section">
        <h2 class="ai-insights-heading">AI Insights</h2>
        <div class="error-state">
          <p>{{ analyticsError }}</p>
          <p class="error-hint">
            Make sure you have completed at least one matching run.
          </p>
        </div>
      </section>

      <section
        v-else-if="!hasInsightsData && !analyticsLoading"
        class="ai-insights-section"
      >
        <h2 class="ai-insights-heading">AI Insights</h2>
        <div class="empty-state">
          <h3>No analytics available yet</h3>
          <p>Generate AI-powered insights from your existing match data.</p>
          <button
            class="generate-btn"
            :disabled="regenerating"
            @click="regenerate"
          >
            Generate Insights
          </button>
        </div>
      </section>
    </template>
  </div>

  <MappingRequiredModal
    v-model="showMapping"
    v-model:missing="missing"
    @edit-mapping="openMapper"
  />

  <MapperModal
    :open="showMapper"
    :mail-headers="mailHeaders"
    :crm-headers="crmHeaders"
    :mail-header-types="mailHeaderTypes"
    :crm-header-types="crmHeaderTypes"
    :mail-samples="mailSamples"
    :crm-samples="crmSamples"
    :mail-fields="mailFields"
    :crm-fields="crmFields"
    :mail-labels="mailLabels"
    :crm-labels="crmLabels"
    :initial-mapping="initialMapping"
    :required-mail="requiredMail"
    :required-crm="requiredCrm"
    :errors="mapperErrors || null"
    :saving="mapperSaving"
    :confirm-label="pendingNormalize ? 'Confirm & Run' : undefined"
    @close="showMapper = false"
    @confirm="onMappingConfirm"
  />

  <CampaignPromptModal
    :open="showCampaignPrompt"
    @confirm="onCampaignPromptConfirm"
    @skip="onCampaignPromptSkip"
  />

  <FirstUploadRunMatchingModal
    :open="showFirstUploadModal"
    :loading="firstUploadRunLoading"
    @close="showFirstUploadModal = false"
    @run-matching="handleFirstUploadRunMatching"
  />

  <PaywallModal
    v-model="showPaywall"
    :config="effectivePaywallConfig"
    :loading="paywallBusy"
    @primary="onPaywallPrimary"
    @secondary="handlePaywallSecondary"
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
.analytics-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 0 40px;
  transition: filter 0.18s ease, opacity 0.18s ease;
}

.analytics-blurred {
  filter: blur(10px);
  opacity: 0.4;
  pointer-events: none;
  user-select: none;
}

/* Screen 1 — centered entry */
.entry-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 16px;
  gap: 28px;
}

.entry-header {
  text-align: center;
  max-width: 480px;
}

.entry-eyebrow {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--pc-canary-deep, #e5b820);
}

.entry-header h1 {
  margin: 0;
  font-family: var(--pc-font-display, "Oswald", sans-serif);
  font-size: clamp(28px, 4vw, 36px);
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--app-text, #1c2430);
}

.entry-header p:not(.entry-eyebrow) {
  margin: 10px 0 0;
  font-size: 15px;
  color: var(--app-text-secondary, #5a6b7d);
  font-weight: 400;
}

.entry-upload {
  width: 100%;
  max-width: 560px;
}

/* Screen 2 — action row (upload + advanced KPIs) */
.action-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

/* AI Insights block */
.ai-insights-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
  padding-top: 20px;
  border-top: 1px solid var(--app-border, #c8d0db);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-insights-heading {
  margin: 0;
  font-family: var(--pc-font-display, "Oswald", sans-serif);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text, #1c2430);
}

.page-header p {
  color: var(--app-text-secondary, #5a6b7d);
  font-size: 13px;
  margin-top: 4px;
  font-weight: 400;
}

.sections-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.run-error {
  border-radius: var(--app-card-radius, 2px);
  border: 1px solid #fecdd3;
  background: #fff1f2;
  padding: 10px 12px;
  font-size: 12px;
  color: #9f1239;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
}

.loading-state.compact {
  padding: 40px 20px;
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
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  text-align: center;
  padding: 40px 20px;
}

.error-state p {
  font-size: 14px;
  color: #c45c5c;
}

.error-hint {
  color: var(--app-text-muted, #8a97a8) !important;
  margin-top: 8px;
  font-size: 13px !important;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  border: 1px solid var(--app-border, #c8d0db);
  background: var(--app-card-bg, #f7f9fb);
  border-radius: var(--app-card-radius, 2px);
}

.empty-state h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text, #1c2430);
  margin: 0 0 8px;
}

.empty-state p {
  font-size: 14px;
  color: var(--app-text-muted, #8a97a8);
  margin: 0;
}

.generate-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 11px 18px;
  border-radius: var(--app-card-radius, 2px);
  border: none;
  background: var(--app-btn-bg, #1c2430);
  color: var(--app-btn-fg, #ffffff);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
  font-family: inherit;
}

.generate-btn:hover:not(:disabled) {
  background: var(--app-btn-bg-hover, #2a3544);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .action-row {
    grid-template-columns: 1fr;
  }

  .sections-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
