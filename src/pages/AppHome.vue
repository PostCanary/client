<!-- src/pages/AppHome.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { captureEvent } from '@/composables/usePostHog'
import type { HomeUserType, HomeUserContext } from '@/types/home'
import { MOCK_HOME_CONTEXT } from '@/types/home'

import HomeReturning from '@/components/app-home/HomeReturning.vue'
import HomeSkeleton from '@/components/app-home/HomeSkeleton.vue'

// Phase A: use mock data. Phase B: replace with real API call
const loading = ref(false)
const context = ref<HomeUserContext>(MOCK_HOME_CONTEXT)

const userType = computed<HomeUserType>(() => {
  const ctx = context.value
  if (ctx.campaignCount === 0 && ctx.batchCount === 0) return 'new'
  if (ctx.campaignCount === 0 && ctx.batchCount > 0) return 'analytics_only'
  if (ctx.daysSinceLastActivity !== null && ctx.daysSinceLastActivity > 30) return 'dormant'
  return 'returning'
})

onMounted(() => {
  captureEvent('home_page_viewed', { userType: userType.value })
})
</script>

<template>
  <div class="app-home">
    <HomeSkeleton v-if="loading" />
    <HomeReturning v-else-if="userType === 'returning'" :context="context" />
    <!-- Phase 8: HomeNew v-else-if="userType === 'new'" -->
    <!-- Phase 9: HomeAnalyticsOnly v-else-if="userType === 'analytics_only'" -->
    <!-- Phase 9: HomeDormant v-else-if="userType === 'dormant'" -->
    <!-- Fallback to returning for now -->
    <HomeReturning v-else :context="context" />
  </div>
</template>

<style scoped>
.app-home {
  max-width: 800px;
}
</style>
