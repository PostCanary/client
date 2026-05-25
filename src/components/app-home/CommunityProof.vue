<!-- src/components/app-home/CommunityProof.vue -->
<script setup lang="ts">
import type { CommunityStats } from '@/types/home'
import { PeopleOutline } from '@vicons/ionicons5'

const props = defineProps<{
  stats: CommunityStats
}>()
</script>

<template>
  <div class="community-card">
    <component :is="PeopleOutline" class="community-icon" />
    <span class="community-text">
      PostCanary businesses sent <strong>{{ stats.totalPostcardsSentThisMonth.toLocaleString() }}</strong> postcards this month
    </span>
  </div>
</template>

<style scoped>
.community-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--app-bg, #f0f2f5);
  border-radius: 10px;
}

.community-icon {
  width: 18px;
  height: 18px;
  color: var(--app-text-muted, #94a3b8);
  flex-shrink: 0;
}

.community-text {
  font-size: 13px;
  color: var(--app-text-secondary, #64748b);
}

.community-text strong {
  color: var(--app-text, #0c2d50);
  font-weight: 600;
}
</style>
