<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  uploaded: number
  suppressed: {
    dnm: number
    past_customer: number
    recently_mailed: number
  }
  deliverable: number
}>()

// DNM > Past > Recent precedence — each row attributed once to highest-priority hit
const totalRemoved = computed(
  () => props.suppressed.dnm + props.suppressed.past_customer + props.suppressed.recently_mailed
)

const suppressionParts = computed(() => {
  const parts: string[] = []
  if (props.suppressed.dnm > 0)
    parts.push(`DNM ×${props.suppressed.dnm.toLocaleString()}`)
  if (props.suppressed.past_customer > 0)
    parts.push(`Past Customers ×${props.suppressed.past_customer.toLocaleString()}`)
  if (props.suppressed.recently_mailed > 0)
    parts.push(`Recently Mailed ×${props.suppressed.recently_mailed.toLocaleString()}`)
  return parts
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-1.5 text-sm text-slate-600 py-2 px-3 bg-slate-50 rounded-lg border border-slate-200">
    <!-- Uploaded count -->
    <span class="font-medium text-[#0b2d50]">{{ uploaded.toLocaleString() }} uploaded</span>

    <span class="text-slate-400">→</span>

    <!-- Removed block (only shown if any suppression) -->
    <template v-if="totalRemoved > 0">
      <span class="text-red-600 font-medium">{{ totalRemoved.toLocaleString() }} removed</span>
      <span class="text-slate-400 text-xs">
        ({{ suppressionParts.join(', ') }})
      </span>
    </template>
    <template v-else>
      <span class="text-slate-400 text-xs">0 removed</span>
    </template>

    <span class="text-slate-400">→</span>

    <!-- Deliverable -->
    <span class="font-semibold text-[#47bfa9]">{{ deliverable.toLocaleString() }} deliverable</span>
  </div>
</template>
