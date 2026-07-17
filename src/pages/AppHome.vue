<!-- src/pages/AppHome.vue -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { captureEvent } from '@/composables/usePostHog'
import { useAuthStore } from '@/stores/auth'

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
  /* Postcard-flow entries are hidden until the org has postcards access
   * (S85 gate) — same rule as the sidebar's SEND MAIL section. */
  requiresPostcards?: boolean
}

/* Dashboard Flow v2 (Tyler wireframe, 2026-07-17): four entry points,
 * titles and subtitles verbatim from the wireframe. */
const allCards: HomeCard[] = [
  {
    key: 'send_postcards',
    title: 'Send Postcards',
    subtitle: 'Launch a new campaign',
    to: '/app/send',
    icon: PaperPlaneOutline,
    requiresPostcards: true,
  },
  {
    key: 'browse_designs',
    title: 'Browse Designs',
    subtitle: 'View your uploads',
    to: '/app/designs',
    icon: ColorPaletteOutline,
    requiresPostcards: true,
  },
  {
    key: 'campaigns',
    title: 'Campaigns',
    subtitle: 'Track your previous mail sends',
    to: '/app/campaigns',
    icon: DocumentTextOutline,
    requiresPostcards: true,
  },
  {
    key: 'analytics',
    title: 'Analytics',
    subtitle: 'Break down mail and CRM data',
    to: '/app/analytics',
    icon: BarChartOutline,
  },
]

const cards = computed(() =>
  allCards.filter((c) => !c.requiresPostcards || auth.hasPostcards),
)

function onCardClick(card: HomeCard) {
  captureEvent('home_card_clicked', { card: card.key })
  router.push(card.to)
}

onMounted(() => {
  captureEvent('home_page_viewed', { layout: 'quad_cards' })
})
</script>

<template>
  <div class="app-home">
    <div class="home-grid">
      <button
        v-for="card in cards"
        :key="card.key"
        type="button"
        class="home-card"
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
</template>

<style scoped>
.app-home {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 320px));
  gap: 24px;
  padding: 24px;
}

.home-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 160px;
  padding: 28px 24px;
  background: #fff;
  border: 1px solid var(--app-border, #dfe4ec);
  border-radius: 14px;
  cursor: pointer;
  color: var(--app-text, #0c2d50);
  text-align: center;
  transition: transform 0.15s ease-out, background 0.15s ease-out,
    color 0.15s ease-out, border-color 0.15s ease-out, box-shadow 0.15s ease-out;
}

/* Wireframe annotation: "responds to user hovering over by filling the
 * button and slightly growing in size" */
.home-card:hover,
.home-card:focus-visible {
  background: var(--app-teal, #47bfa9);
  border-color: var(--app-teal, #47bfa9);
  color: #fff;
  transform: scale(1.04);
  box-shadow: 0 8px 24px rgba(71, 191, 169, 0.35);
}

.home-card:focus-visible {
  outline: 2px solid var(--app-teal-hover, #3aa893);
  outline-offset: 2px;
}

.home-card-icon {
  width: 40px;
  height: 40px;
  display: inline-flex;
}

.home-card-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.home-card-title {
  font-size: 1.15rem;
  font-weight: 700;
}

.home-card-subtitle {
  font-size: 0.9rem;
  opacity: 0.75;
}

@media (max-width: 639px) {
  .home-grid {
    grid-template-columns: 1fr;
    width: 100%;
  }

  .home-card {
    min-height: 120px;
  }
}
</style>
