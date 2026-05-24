<script setup lang="ts">
import { computed } from 'vue'
import type { AudienceCostPreview } from '@/types/audiences'

const props = defineProps<{
  costPreview: AudienceCostPreview | null
}>()

// Derive from the type's own field — single source of truth (Codex HIGH finding)
const isEnrichEnabled = computed(() => props.costPreview?.enrich_enabled ?? false)

const perCardSubtotal = computed(() => {
  if (!props.costPreview) return null
  return (props.costPreview.per_card_subtotal_cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
})

const perCardRate = computed(() => {
  if (!props.costPreview) return null
  return (props.costPreview.per_card_cost_cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
})

const melissaTotal = computed(() => {
  if (props.costPreview?.melissa_enrich_estimate_cents == null) return null
  return (props.costPreview.melissa_enrich_estimate_cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
})

const grandTotal = computed(() => {
  if (!props.costPreview) return null
  return (props.costPreview.total_cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
})
</script>

<template>
  <div class="rounded-lg border border-slate-200 overflow-hidden">
    <!-- Mailing cost row (always shown) -->
    <div class="px-4 py-3 bg-white">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-[#0b2d50]">Postcard mailing</span>
        <span v-if="costPreview" class="text-sm font-semibold text-[#0b2d50]">
          {{ perCardSubtotal }}
          <span class="text-xs font-normal text-slate-400 ml-1">
            ({{ costPreview.deliverable_count.toLocaleString() }} × {{ perCardRate }})
          </span>
        </span>
        <span v-else class="text-sm text-slate-400">—</span>
      </div>
    </div>

    <!-- Enrich add-on — Phase 1 disabled state -->
    <div
      class="px-4 py-3 border-t border-slate-100"
      :class="isEnrichEnabled ? 'bg-white' : 'bg-slate-50 opacity-60'"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <span class="text-sm font-medium text-slate-500">Melissa address enrichment</span>
          <p v-if="!isEnrichEnabled" class="text-xs text-slate-400 mt-0.5">
            Optional add-on (not yet available) — your list will mail as-is
          </p>
        </div>
        <span v-if="isEnrichEnabled && melissaTotal" class="text-sm font-semibold text-slate-700 shrink-0">
          {{ melissaTotal }}
        </span>
        <span v-else class="text-xs text-slate-400 shrink-0 mt-0.5">Coming after Phase 2</span>
      </div>
    </div>

    <!-- Grand total (only shown when costPreview available) -->
    <div v-if="costPreview" class="px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-between">
      <span class="text-sm font-semibold text-[#0b2d50]">Total estimate</span>
      <span class="text-base font-bold text-[#47bfa9]">{{ grandTotal }}</span>
    </div>
  </div>
</template>
