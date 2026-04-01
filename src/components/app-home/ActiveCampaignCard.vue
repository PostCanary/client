<!-- src/components/app-home/ActiveCampaignCard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { HomeCampaignSummary } from '@/types/home'

const props = defineProps<{
  campaign: HomeCampaignSummary
}>()

const router = useRouter()

const statusColor = computed(() => {
  switch (props.campaign.status) {
    case 'draft': return '#94a3b8'
    case 'approved': return '#3b82f6'
    case 'printing': return '#f59e0b'
    case 'in_transit': return '#47bfa9'
    case 'delivered': return '#22c55e'
    case 'results_ready': return '#8b5cf6'
    case 'completed': return '#22c55e'
    case 'paused': return '#ef4444'
    default: return '#94a3b8'
  }
})

const progressText = computed(() => {
  return `Card ${props.campaign.cardsSent} of ${props.campaign.totalCards} sent`
})

const nextEventText = computed(() => {
  if (!props.campaign.nextCardDate) return null
  const date = new Date(props.campaign.nextCardDate)
  const now = new Date()
  const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Next card mailing soon'
  return `Card ${props.campaign.cardsSent + 1} mails in ${days} day${days === 1 ? '' : 's'}`
})
</script>

<template>
  <button
    class="campaign-card"
    @click="router.push(`/app/campaigns/${campaign.id}`)"
    type="button"
  >
    <div class="campaign-card-header">
      <span class="campaign-name">{{ campaign.name }}</span>
      <span class="campaign-status" :style="{ background: statusColor + '1a', color: statusColor }">
        {{ campaign.statusLabel }}
      </span>
    </div>

    <div class="campaign-progress">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: (campaign.cardsSent / campaign.totalCards * 100) + '%' }"
        ></div>
      </div>
      <span class="progress-text">{{ progressText }}</span>
    </div>

    <div class="campaign-meta">
      <span v-if="nextEventText" class="meta-item">{{ nextEventText }}</span>
      <span class="meta-item meta-item--highlight">{{ campaign.matchCount }} attributed result{{ campaign.matchCount === 1 ? '' : 's' }}</span>
    </div>
  </button>
</template>

<style scoped>
.campaign-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--app-card-bg, #ffffff);
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 0.12s ease, box-shadow 0.12s ease;
}

.campaign-card:hover {
  box-shadow: 0 2px 8px rgba(12, 45, 80, 0.08);
}

.campaign-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.campaign-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
}

.campaign-status {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.campaign-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-bar {
  height: 6px;
  background: var(--app-bg, #f0f2f5);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--app-teal, #47bfa9);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--app-text-muted, #94a3b8);
}

.campaign-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-item {
  font-size: 12px;
  color: var(--app-text-secondary, #64748b);
}

.meta-item--highlight {
  font-weight: 600;
  color: var(--app-teal, #47bfa9);
}
</style>
