<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Step2Header from '@/components/wizard/Step2Header.vue'
import SuppressionStrip from '@/components/wizard/SuppressionStrip.vue'
import EnrichCostBlock from '@/components/wizard/EnrichCostBlock.vue'
import AudienceMapPreview from '@/components/wizard/AudienceMapPreview.vue'
import {
  createAudience,
  suppressAudience,
  getAudienceCost,
  approveAudience,
} from '@/api/audiences'
import type {
  AudienceSuppressionResult,
  AudienceCostPreview,
  AudienceCreateOk,
  AudienceCreateExistingMatch,
  AudienceCreateMappingRequired,
} from '@/types/audiences'

type MapPoint = { lat: number; lng: number; label?: string }

// Audience-source contract: CSV upload (file prop) OR existing audience (existingAudienceId).
// Exactly one of file / existingAudienceId must be supplied at runtime; enforced by parent.
const props = defineProps<{
  /** 'csv' = new upload; 'existing' = pick from org library */
  audienceSource: 'csv' | 'existing'
  /** Required when audienceSource === 'csv' */
  file?: File
  /** Required when audienceSource === 'existing' */
  existingAudienceId?: string
  /** Optional — audience is attached to this campaign at approve-time */
  campaignId?: string
}>()

const emit = defineEmits<{
  (e: 'approved', audienceId: string, campaignId: string | null): void
  (e: 'back'): void
}>()

// ── reactive state ────────────────────────────────────────────────────────────
const audienceId = ref<string | null>(null)
const suppression = ref<AudienceSuppressionResult | null>(null)
const costPreview = ref<AudienceCostPreview | null>(null)
const mapPoints = ref<MapPoint[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const approving = ref(false)

// ── derived ───────────────────────────────────────────────────────────────────
const canApprove = computed(
  () =>
    !loading.value &&
    !approving.value &&
    audienceId.value !== null &&
    suppression.value !== null &&
    costPreview.value !== null,
)

const suppressionProps = computed(() => {
  if (!suppression.value) return null
  return {
    uploaded: suppression.value.uploaded_count,
    suppressed: {
      dnm: suppression.value.suppressed.dnm,
      past_customer: suppression.value.suppressed.past_customer,
      recently_mailed: suppression.value.suppressed.recently_mailed,
    },
    deliverable: suppression.value.deliverable_count,
  }
})

const headerSubText = computed(() =>
  props.audienceSource === 'csv'
    ? 'Review your uploaded list before approving for mailing'
    : 'Review your selected audience before approving for mailing',
)

// ── orchestration: upload → suppress → cost ───────────────────────────────────
// Phase 1 map points are empty — AudienceMapPreview renders "No address points"
// until the backend returns geocoded coordinates in a future phase.
async function runFlow(): Promise<void> {
  // Runtime prop invariant guard (MEDIUM: comment-only in props block is insufficient)
  if (props.audienceSource === 'csv' && !props.file) {
    error.value = 'No file provided for CSV upload'
    return
  }
  if (props.audienceSource === 'existing' && !props.existingAudienceId) {
    error.value = 'No audience selected'
    return
  }

  error.value = null
  loading.value = true

  try {
    // 1. Resolve audience ID
    if (props.audienceSource === 'csv') {
      const res = await createAudience({ file: props.file! })

      // 409 → columns unmapped; surface actionable error before any suppression
      if (res.status === 409) {
        const mappingErr = res.data as AudienceCreateMappingRequired
        const missingHint = mappingErr.missing?.length
          ? ` Missing columns: ${mappingErr.missing.join(', ')}.`
          : ''
        error.value = `Column mapping required before this list can be used.${missingHint}`
        return
      }

      if (res.status !== 201 && res.status !== 200) {
        error.value = (res.data as Record<string, unknown>)?.message as string ?? 'Upload failed'
        return
      }

      // 200 + re_upload_prompt: existing match — proceed with existing audience ID
      const createData = res.data as AudienceCreateOk | AudienceCreateExistingMatch
      audienceId.value = createData.audience?.id ?? null
    } else {
      audienceId.value = props.existingAudienceId ?? null
    }

    if (!audienceId.value) throw new Error('Could not resolve audience ID')

    // 2. Suppression (DNM > Past > Recent — server enforces precedence)
    suppression.value = await suppressAudience(audienceId.value)
    mapPoints.value = [] // Phase 1: no geocoded points yet

    // 3. Cost preview (enrich_enabled=false from API in Phase 1 — EnrichCostBlock derives from field)
    costPreview.value = await getAudienceCost(audienceId.value)
  } catch (err: unknown) {
    error.value = (err as Error)?.message ?? 'An error occurred'
  } finally {
    loading.value = false
  }
}

async function handleApprove(): Promise<void> {
  if (!audienceId.value || approving.value) return
  approving.value = true
  error.value = null
  try {
    const res = await approveAudience({
      audience_id: audienceId.value,
      ...(props.campaignId ? { campaign_id: props.campaignId } : {}),
    })
    emit('approved', res.audience_id, res.campaign_id)
  } catch (err: unknown) {
    error.value = (err as Error)?.message ?? 'Approval failed'
  } finally {
    approving.value = false
  }
}

onMounted(runFlow)
</script>

<template>
  <div class="space-y-5 p-6">
    <!-- Step header -->
    <Step2Header
      :step-number="2"
      strategy="Send to a List"
      :sub-text="headerSubText"
    />

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex items-center gap-2 text-sm text-slate-500 py-4"
      data-testid="loading-indicator"
    >
      <svg
        class="animate-spin h-4 w-4 shrink-0 text-[#47bfa9]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Processing your audience…
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
      role="alert"
      data-testid="error-banner"
    >
      {{ error }}
    </div>

    <!-- Suppression strip — shown once suppression data arrives -->
    <SuppressionStrip
      v-if="suppressionProps"
      :uploaded="suppressionProps.uploaded"
      :suppressed="suppressionProps.suppressed"
      :deliverable="suppressionProps.deliverable"
      data-testid="suppression-strip"
    />

    <!-- Audience map preview (Phase 1: empty points → fallback message rendered by child) -->
    <AudienceMapPreview
      :points="mapPoints"
      data-testid="audience-map"
    />

    <!-- Cost block: passes full preview; enrich_enabled comes from API (false in Phase 1) -->
    <EnrichCostBlock
      :cost-preview="costPreview"
      data-testid="enrich-cost-block"
    />

    <!-- Approve / Back actions -->
    <div class="flex items-center justify-between pt-4 border-t border-slate-100">
      <button
        type="button"
        class="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
        data-testid="back-btn"
        @click="emit('back')"
      >
        Back
      </button>

      <button
        type="button"
        :disabled="!canApprove"
        class="px-6 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#47bfa9] focus-visible:ring-offset-2"
        :class="
          canApprove
            ? 'bg-[#47bfa9] text-white hover:bg-[#3aad97]'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        "
        data-testid="approve-btn"
        @click="handleApprove"
      >
        <span v-if="approving">Approving…</span>
        <span v-else>Approve &amp; Continue</span>
      </button>
    </div>
  </div>
</template>
