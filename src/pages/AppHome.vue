<!-- src/pages/AppHome.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { captureEvent } from '@/composables/usePostHog'
import type { HomeUserType, HomeUserContext } from '@/types/home'
import { MOCK_HOME_CONTEXT } from '@/types/home'
import { useAuthStore } from '@/stores/auth'

import HomeReturning from '@/components/app-home/HomeReturning.vue'
import HomeNew from '@/components/app-home/HomeNew.vue'
import HomeAnalyticsOnly from '@/components/app-home/HomeAnalyticsOnly.vue'
import HomeDormant from '@/components/app-home/HomeDormant.vue'
import HomeSkeleton from '@/components/app-home/HomeSkeleton.vue'

const auth = useAuthStore()

// Phase A: mock data for most fields; real firstName wired from the auth
// store so the greeting matches whoever's actually logged in. Phase B
// replaces the rest of this with a real /api/home-context call.
const firstName = computed(() => {
  const name = auth.userName
  if (!name || name === 'User') return MOCK_HOME_CONTEXT.firstName
  return name.split(' ')[0] ?? MOCK_HOME_CONTEXT.firstName
})

const loading = ref(false)
const context = computed<HomeUserContext>(() => ({
  ...MOCK_HOME_CONTEXT,
  firstName: firstName.value,
}))

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
    <HomeNew v-else-if="userType === 'new'" :context="context" />
    <HomeAnalyticsOnly v-else-if="userType === 'analytics_only'" :context="context" />
    <HomeDormant v-else-if="userType === 'dormant'" :context="context" />
    <HomeReturning v-else :context="context" />
  </div>
</template>

<style scoped>
.app-home {
  max-width: 800px;
}
</style>
