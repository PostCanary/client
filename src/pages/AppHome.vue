<!-- src/pages/AppHome.vue -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { captureEvent } from '@/composables/usePostHog'
import { useAuthStore } from '@/stores/auth'
import { isFirstSessionProfile } from '@/utils/firstRunSetup'
import { getLatestRunResult, type KPIs } from '@/api/runs'
import RevenueChip from '@/components/app-home/RevenueChip.vue'

/* Icons from @vicons/ionicons5 only — mixing icon sources caused the
 * teal-vs-navy inconsistency Drake caught in S69. */
import {
  PaperPlaneOutline,
  ColorPaletteOutline,
  DocumentTextOutline,
  BarChartOutline,
} from '@vicons/ionicons5'

const router = useRouter()
const auth = useAuthStore()

interface HomeCard {
  key: string
  title: string
  subtitle: string
  to: string
  icon: any
}

/* Dashboard Flow v2 (Tyler wireframe, 2026-07-17): four entry points,
 * titles and subtitles verbatim from the wireframe. */
const cards: HomeCard[] = [
  {
    key: 'send_postcards',
    title: 'Send Postcards',
    subtitle: 'Launch a new campaign',
    to: '/app/send',
    icon: PaperPlaneOutline,
  },
  {
    key: 'browse_designs',
    title: 'Browse Designs',
    subtitle: 'View your uploads',
    to: '/app/designs',
    icon: ColorPaletteOutline,
  },
  {
    key: 'campaigns',
    title: 'Campaigns',
    subtitle: 'Track your previous mail sends',
    to: '/app/campaigns',
    icon: DocumentTextOutline,
  },
  {
    key: 'analytics',
    title: 'Analytics',
    subtitle: 'Break down mail and CRM data',
    to: '/app/analytics',
    icon: BarChartOutline,
  },
]

const firstName = computed(() => auth.userName.split(' ')[0])
const isFirstSession = computed(() => isFirstSessionProfile(auth.profile))
const greeting = computed(() =>
  isFirstSession.value
    ? `Welcome, ${firstName.value}`
    : `Welcome back, ${firstName.value}`,
)

const homeKpis = ref<KPIs | null>(null)
const showRevenueChip = computed(() => homeKpis.value != null)

const tagline = computed(() => {
  if (isFirstSession.value) {
    return 'Send your first campaign when you are ready.'
  }
  if (showRevenueChip.value) {
    return 'Your mail is converting. Pick the next move.'
  }
  return 'Pick up where you left off, or start something new.'
})

function onCardClick(card: HomeCard) {
  captureEvent('home_card_clicked', { card: card.key })
  router.push(card.to)
}

onMounted(async () => {
  captureEvent('home_page_viewed', { layout: 'quad_cards_revenue_chip' })
  try {
    const result = await getLatestRunResult('done')
    homeKpis.value = result?.kpis ?? null
  } catch {
    homeKpis.value = null
  }
})
</script>

<template>
  <div class="app-home">
    <div class="home-content">
      <header class="home-header">
        <h1 class="home-greeting">{{ greeting }}</h1>
        <p class="home-tagline">
          {{ tagline }}
        </p>
      </header>

      <RevenueChip v-if="homeKpis" :kpis="homeKpis" />

      <div class="home-grid">
        <button
          v-for="(card, i) in cards"
          :key="card.key"
          type="button"
          class="home-card"
          :style="{ '--enter-delay': `${i * 60}ms` }"
          @click="onCardClick(card)"
        >
          <span class="home-card-icon" aria-hidden="true">
            <component :is="card.icon" />
          </span>
          <span class="home-card-title">{{ card.title }}</span>
          <span class="home-card-subtitle">{{ card.subtitle }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-home {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px 48px;
}

.home-content {
  width: 100%;
  max-width: 920px;
}

.home-header {
  margin-bottom: 22px;
  text-align: left;
}

.home-greeting {
  margin: 0 0 6px;
  font-family: var(--pc-font-display, "Oswald", sans-serif);
  font-size: clamp(1.6rem, 2.5vw, 2.1rem);
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--app-text, #1c2430);
}

.home-tagline {
  margin: 0;
  font-size: 1rem;
  color: var(--app-text-secondary, #5a6b7d);
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.home-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 10px;
  min-height: 148px;
  padding: 22px 20px;
  background: var(--app-card-bg, #f7f9fb);
  border: 1px solid var(--app-border, #c8d0db);
  border-radius: var(--app-card-radius, 2px);
  cursor: pointer;
  color: var(--app-text, #1c2430);
  text-align: left;
  box-shadow: none;
  transition: transform 0.15s ease-out, background 0.15s ease-out,
    color 0.15s ease-out, border-color 0.15s ease-out;
  animation: card-enter 0.35s ease-out both;
  animation-delay: var(--enter-delay, 0ms);
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Navy fill on hover — actionable navigation surface with AA contrast. */
.home-card:hover,
.home-card:focus-visible {
  background: var(--app-navy, #1c2430);
  border-color: var(--app-navy, #1c2430);
  color: #fff;
  transform: translateY(-1px);
}

.home-card:focus-visible {
  outline: 2px solid var(--app-focus-ring, #1c2430);
  outline-offset: 2px;
}

.home-card-icon {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--app-card-radius, 2px);
  background: rgba(38, 175, 163, 0.12);
  color: var(--app-teal, #26afa3);
  transition: background 0.15s ease-out, color 0.15s ease-out;
}

.home-card:hover .home-card-icon,
.home-card:focus-visible .home-card-icon {
  background: rgba(250, 207, 65, 0.18);
  color: var(--pc-canary, #facf41);
}

.home-card-icon :deep(svg) {
  width: 22px;
  height: 22px;
}

.home-card-title {
  font-size: 1.05rem;
  font-weight: 700;
}

.home-card-subtitle {
  font-size: 0.88rem;
  color: var(--app-text-secondary, #5a6b7d);
  line-height: 1.35;
  transition: color 0.15s ease-out;
}

.home-card:hover .home-card-subtitle,
.home-card:focus-visible .home-card-subtitle {
  color: #aeb8c4;
}

@media (prefers-reduced-motion: reduce) {
  .home-card {
    animation: none;
  }

  .home-card:hover,
  .home-card:focus-visible {
    transform: none;
  }
}

@media (max-width: 639px) {
  .app-home {
    align-items: flex-start;
    padding-top: 24px;
  }

  .home-grid {
    grid-template-columns: 1fr;
  }

  .home-card {
    min-height: 120px;
    padding: 20px 18px;
  }
}
</style>
