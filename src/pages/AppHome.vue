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

const firstName = computed(() => auth.userName.split(' ')[0])

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
    <div class="home-content">
      <header class="home-header">
        <h1 class="home-greeting">Welcome back, {{ firstName }}</h1>
        <p class="home-tagline">
          Pick up where you left off, or start something new.
        </p>
      </header>
      <div class="home-grid" :class="{ single: cards.length === 1 }">
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
  margin-bottom: 28px;
  text-align: left;
}

.home-greeting {
  margin: 0 0 6px;
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--app-text, #0c2d50);
}

.home-tagline {
  margin: 0;
  font-size: 1rem;
  color: #52677b;
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.home-grid.single {
  grid-template-columns: minmax(220px, 440px);
}

.home-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 210px;
  padding: 32px 28px;
  background: #fff;
  border: 1px solid var(--app-border, #dfe4ec);
  border-radius: 16px;
  cursor: pointer;
  color: var(--app-text, #0c2d50);
  text-align: center;
  box-shadow: 0 1px 3px rgba(12, 45, 80, 0.06);
  transition: transform 0.15s ease-out, background 0.15s ease-out,
    color 0.15s ease-out, border-color 0.15s ease-out, box-shadow 0.15s ease-out;
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

/* The wireframe asked for a fill on hover, and it was teal. That made a card
 * read as an action surface in the same colour buttons no longer use, so the
 * page carried two competing "actionable" colours (POS-279).
 *
 * A card is a surface you navigate into, not a control you press, so it gets
 * a card affordance: it stays light and gains a navy edge and lift. Text
 * holds 13.94:1 rather than the 4.78:1 the teal fill allowed. */
.home-card:hover,
.home-card:focus-visible {
  background: var(--app-card-bg, #ffffff);
  border-color: var(--app-navy, #0b2d50);
  color: var(--app-navy, #0b2d50);
  transform: scale(1.02);
  box-shadow: 0 0 0 1px var(--app-navy, #0b2d50), 0 12px 28px rgba(11, 45, 80, 0.16);
}

/* Navy, not teal: the teal ring measures 2.01:1 against --app-bg and fails
 * WCAG 1.4.11 (3:1). Navy holds 12.44:1 over the page. */
.home-card:focus-visible {
  outline: 2px solid var(--app-focus-ring, #0b2d50);
  outline-offset: 2px;
}

.home-card-icon {
  width: 60px;
  height: 60px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(71, 191, 169, 0.12);
  color: var(--app-teal, #47bfa9);
  transition: background 0.15s ease-out, color 0.15s ease-out;
}

/* The card no longer fills, so a white wash would vanish. Tint toward navy
 * so the icon picks up the same emphasis as the border. */
.home-card:hover .home-card-icon,
.home-card:focus-visible .home-card-icon {
  background: rgba(11, 45, 80, 0.08);
  color: var(--app-navy, #0b2d50);
}

.home-card-icon :deep(svg) {
  width: 30px;
  height: 30px;
}

.home-card-title {
  font-size: 1.2rem;
  font-weight: 700;
}

.home-card-subtitle {
  font-size: 0.92rem;
  color: #52677b;
  transition: color 0.15s ease-out;
}

/* The card keeps its light background on hover, so the subtitle keeps its
 * muted colour and the title/subtitle hierarchy survives. #52677b on white
 * is 5.86:1. It only needed overriding back when the card filled. */

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

  .home-grid,
  .home-grid.single {
    grid-template-columns: 1fr;
  }

  .home-card {
    min-height: 150px;
    padding: 24px 20px;
  }

  .home-greeting {
    font-size: 1.4rem;
  }
}
</style>
