<script setup lang="ts">
/**
 * Dev-only harness for SttLStep2. Not linked from navigation.
 * Open via: http://localhost:5175/dev/sttl-step2-preview
 * Playwright sttl-step2.spec.ts targets this route.
 */
import { ref, onMounted } from 'vue'
import SttLStep2 from '@/components/wizard/strategies/SttLStep2.vue'

const file = ref<File | null>(null)
const approved = ref<{ audienceId: string; campaignId: string | null } | null>(null)
const wentBack = ref(false)

onMounted(() => {
  // Synthetic 3-row CSV — mimics Bob uploading a mailing list.
  const csv = 'Address,City,State,ZIP\n123 Main St,Austin,TX,78701\n456 Oak Ave,Austin,TX,78702\n789 Pine Rd,Austin,TX,78703'
  file.value = new File([csv], 'test-list.csv', { type: 'text/csv' })
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-8">
    <div class="bg-white rounded-xl shadow-md w-full max-w-xl">
      <div v-if="approved" class="p-6 text-green-700 font-medium" data-testid="approved-confirmation">
        Approved — audience {{ approved.audienceId }}
      </div>
      <div v-else-if="wentBack" class="p-6 text-slate-500" data-testid="went-back">
        Navigated back
      </div>
      <SttLStep2
        v-else-if="file"
        audience-source="csv"
        :file="file"
        @approved="(id, cid) => { approved = { audienceId: id, campaignId: cid } }"
        @back="wentBack = true"
      />
    </div>
  </div>
</template>
