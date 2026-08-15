<!-- src/components/marketing/sections/HeroScenes.vue -->
<script setup lang="ts">
import { computed } from "vue";

/**
 * Reel-synced hero scenes. Each scene is a lightweight SVG/CSS animation that
 * matches the product concept the rolling headline is showing at that moment.
 * Driven entirely by the hero's reel `index` prop — no independent timers, so
 * the visual and the text can never drift apart.
 */

const props = defineProps<{
  /** The hero reel index (0..PAIRS.length-1). */
  index: number;
  /** Freeze the animation (reduced-motion / data-saver). */
  paused?: boolean;
}>();

// The 7 reel pairs collapse to 4 product concepts.
type SceneId = "postcanary" | "eddm" | "targeted-mail" | "analytics";

const scene = computed<SceneId>(() => {
  switch (props.index) {
    case 4:
      return "eddm";
    case 5:
      return "targeted-mail";
    case 6:
      return "analytics";
    default:
      // 0 "Everyone" + 1-3 verticals (Roofers/Restaurants/Plumbers) all show
      // the full matchback loop.
      return "postcanary";
  }
});

const sceneLabel = computed(
  () =>
    ({
      postcanary: "Mail matched to revenue",
      eddm: "Every door on the route",
      "targeted-mail": "Filtered to your customer",
      analytics: "Every conversion tracked",
    })[scene.value],
);
</script>

<template>
  <div class="hero-scenes" :class="{ 'is-paused': props.paused }" aria-hidden="true">
    <Transition name="scene-swap">
      <div :key="scene" class="hero-scenes__frame">
        <p class="hero-scenes__label">{{ sceneLabel }}</p>

        <!-- ── Matchback loop (PostCanary for Everyone / verticals) ─────── -->
        <svg v-if="scene === 'postcanary'" viewBox="0 0 320 200" class="scene">
          <!-- postcard -->
          <g class="sc-postcard">
            <rect x="16" y="70" width="74" height="48" rx="5" class="card" />
            <path d="M20 78 L53 100 L86 78" class="card-flap" />
          </g>
          <!-- mailboxes -->
          <g class="sc-boxes">
            <g v-for="(y, i) in [46, 96, 146]" :key="i" class="sc-box" :style="{ '--i': i }">
              <rect :x="150" :y="y" width="20" height="26" rx="3" class="box" />
              <rect :x="157" :y="y - 8" width="6" height="10" rx="2" class="box-flag" />
            </g>
          </g>
          <!-- connecting match lines -->
          <g class="sc-links">
            <path v-for="(y, i) in [59, 109, 159]" :key="i" :d="`M170 ${y} C 210 ${y}, 220 ${y}, 258 ${y}`" class="link" :style="{ '--i': i }" />
          </g>
          <!-- revenue nodes -->
          <g class="sc-rev">
            <circle v-for="(y, i) in [59, 109, 159]" :key="i" cx="262" :cy="y" r="9" class="rev-node" :style="{ '--i': i }" />
            <text x="262" y="30" text-anchor="middle" class="rev-text">$</text>
          </g>
        </svg>

        <!-- ── EDDM: routes saturate a neighborhood ─────────────────────── -->
        <svg v-else-if="scene === 'eddm'" viewBox="0 0 320 200" class="scene">
          <g class="sc-route">
            <path d="M30 40 H290 M30 80 H290 M30 120 H290 M30 160 H290" class="route-line" />
          </g>
          <g class="sc-houses">
            <g v-for="n in 12" :key="n" class="sc-house" :style="{ '--i': n }">
              <rect
                :x="34 + ((n - 1) % 6) * 44"
                :y="52 + Math.floor((n - 1) / 6) * 60"
                width="22"
                height="18"
                rx="2"
                class="house"
              />
            </g>
          </g>
        </svg>

        <!-- ── Targeted Mail: filters narrow to ideal households ────────── -->
        <svg v-else-if="scene === 'targeted-mail'" viewBox="0 0 320 200" class="scene">
          <g class="sc-rows">
            <g v-for="(w, i) in [240, 240, 240, 240, 240]" :key="i" class="sc-row" :class="{ 'is-match': i === 1 || i === 3 }" :style="{ '--i': i }">
              <rect :x="40" :y="36 + i * 30" :width="w" height="16" rx="8" class="row" />
            </g>
          </g>
          <g class="sc-funnel">
            <path d="M40 20 H280 L200 190 H120 Z" class="funnel" />
          </g>
        </svg>

        <!-- ── Analytics: KPI ticks + chart draws ───────────────────────── -->
        <svg v-else viewBox="0 0 320 200" class="scene">
          <g class="sc-chart">
            <polyline points="40,160 90,120 140,140 190,84 240,100 290,52" class="chart-line" />
            <circle v-for="(p, i) in [[90,120],[140,140],[190,84],[240,100],[290,52]]" :key="i" :cx="p[0]" :cy="p[1]" r="5" class="chart-dot" :style="{ '--i': i }" />
          </g>
          <g class="sc-bars">
            <rect v-for="(h, i) in [30, 52, 44, 70, 92]" :key="i" :x="46 + i * 50" :y="180 - h" width="26" :height="h" rx="4" class="bar" :style="{ '--i': i }" />
          </g>
        </svg>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.hero-scenes {
  position: relative;
  width: 100%;
  aspect-ratio: 8 / 5;
}

.hero-scenes__frame {
  position: absolute;
  inset: 0;
  border-radius: var(--mkt-card-radius);
  background:
    radial-gradient(110% 90% at 15% 0%, color-mix(in srgb, var(--pc-teal-brand) 30%, transparent) 0%, transparent 60%),
    radial-gradient(90% 80% at 90% 100%, color-mix(in srgb, var(--pc-canary) 18%, transparent) 0%, transparent 58%),
    linear-gradient(150deg, var(--pc-navy) 0%, color-mix(in srgb, var(--pc-navy) 68%, var(--pc-teal-brand)) 100%);
  box-shadow: var(--mkt-card-shadow-lg);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-scenes__label {
  position: absolute;
  top: 1rem;
  left: 1.15rem;
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--pc-canary) 88%, white);
}

.scene {
  width: 82%;
  height: auto;
  margin-top: 1.5rem;
}

/* ── Shared swap transition ──────────────────────────────────────────── */
.scene-swap-enter-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.scene-swap-leave-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.scene-swap-enter-from { opacity: 0; transform: translateY(14px) scale(0.98); }
.scene-swap-leave-to { opacity: 0; transform: translateY(-14px) scale(0.98); }

/* ── Matchback scene ─────────────────────────────────────────────────── */
.card { fill: var(--pc-canary); }
.card-flap { fill: none; stroke: var(--pc-navy); stroke-width: 2.5; }
.sc-postcard { animation: postcard-in 3.4s ease-in-out infinite; }
@keyframes postcard-in {
  0%, 12% { transform: translate(-30px, -18px); opacity: 0; }
  30%, 78% { transform: translate(0, 0); opacity: 1; }
  92%, 100% { transform: translate(0, 0); opacity: 0; }
}
.box { fill: color-mix(in srgb, var(--pc-white) 22%, transparent); }
.box-flag { fill: var(--pc-white); opacity: 0.5; }
.sc-box { animation: box-glow 3.4s ease-in-out infinite; animation-delay: calc(var(--i) * 0.25s + 0.5s); }
@keyframes box-glow {
  0%, 28% { opacity: 0.35; }
  45%, 80% { opacity: 1; }
  95%, 100% { opacity: 0.35; }
}
.link { fill: none; stroke: var(--pc-teal-brand); stroke-width: 2.5; stroke-linecap: round;
  stroke-dasharray: 90; stroke-dashoffset: 90; opacity: 0.9;
  animation: link-draw 3.4s ease-in-out infinite; animation-delay: calc(var(--i) * 0.22s + 1s); }
@keyframes link-draw {
  0%, 40% { stroke-dashoffset: 90; opacity: 0; }
  60%, 82% { stroke-dashoffset: 0; opacity: 1; }
  96%, 100% { stroke-dashoffset: 0; opacity: 0; }
}
.rev-node { fill: var(--pc-teal-brand); transform-origin: center; transform-box: fill-box;
  animation: rev-pop 3.4s ease-in-out infinite; animation-delay: calc(var(--i) * 0.22s + 1.3s); }
@keyframes rev-pop {
  0%, 52% { transform: scale(0); opacity: 0; }
  66%, 84% { transform: scale(1); opacity: 1; }
  96%, 100% { transform: scale(1); opacity: 0; }
}
.rev-text { fill: var(--pc-canary); font-size: 1.4rem; font-weight: 700; opacity: 0.9; }

/* ── EDDM scene ──────────────────────────────────────────────────────── */
.route-line { stroke: color-mix(in srgb, var(--pc-white) 26%, transparent); stroke-width: 2; }
.house { fill: var(--pc-teal-brand); transform-origin: center; transform-box: fill-box;
  animation: house-fill 3s ease-in-out infinite; animation-delay: calc(var(--i) * 0.14s); }
@keyframes house-fill {
  0%, 20% { transform: scale(0.4); opacity: 0; }
  45%, 80% { transform: scale(1); opacity: 1; }
  96%, 100% { transform: scale(1); opacity: 0.25; }
}

/* ── Targeted Mail scene ─────────────────────────────────────────────── */
.row { fill: color-mix(in srgb, var(--pc-white) 18%, transparent); transition: fill 0.3s; }
.sc-row { transform-origin: left center; transform-box: fill-box;
  animation: row-narrow 3s ease-in-out infinite; animation-delay: calc(var(--i) * 0.12s); }
.sc-row.is-match .row { fill: var(--pc-canary); }
@keyframes row-narrow {
  0%, 25% { transform: scaleX(1); opacity: 0.6; }
  50%, 82% { transform: scaleX(var(--w, 0.55)); opacity: 1; }
  96%, 100% { transform: scaleX(1); opacity: 0.6; }
}
.sc-row.is-match { --w: 0.7; }
.funnel { fill: none; stroke: var(--pc-teal-brand); stroke-width: 2.5; opacity: 0.55;
  stroke-dasharray: 6 6; }

/* ── Analytics scene ─────────────────────────────────────────────────── */
.chart-line { fill: none; stroke: var(--pc-canary); stroke-width: 3; stroke-linecap: round;
  stroke-linejoin: round; stroke-dasharray: 400; stroke-dashoffset: 400;
  animation: chart-draw 3.2s ease-in-out infinite; }
@keyframes chart-draw {
  0%, 18% { stroke-dashoffset: 400; }
  60%, 84% { stroke-dashoffset: 0; }
  96%, 100% { stroke-dashoffset: 0; opacity: 0.3; }
}
.chart-dot { fill: var(--pc-white); transform-origin: center; transform-box: fill-box;
  animation: dot-pop 3.2s ease-in-out infinite; animation-delay: calc(var(--i) * 0.18s + 0.7s); }
@keyframes dot-pop {
  0%, 40% { transform: scale(0); }
  58%, 86% { transform: scale(1); }
  96%, 100% { transform: scale(0); }
}
.bar { fill: var(--pc-teal-brand); opacity: 0.85; transform-origin: bottom; transform-box: fill-box;
  animation: bar-rise 3.2s ease-in-out infinite; animation-delay: calc(var(--i) * 0.14s + 0.3s); }
@keyframes bar-rise {
  0%, 22% { transform: scaleY(0); }
  55%, 82% { transform: scaleY(1); }
  95%, 100% { transform: scaleY(1); opacity: 0.3; }
}

/* Paused / reduced-motion: freeze everything at a readable mid-state. */
.is-paused .sc-postcard,
.is-paused .sc-box,
.is-paused .link,
.is-paused .rev-node,
.is-paused .sc-house,
.is-paused .sc-row,
.is-paused .chart-line,
.is-paused .chart-dot,
.is-paused .bar,
.is-paused .funnel {
  animation: none !important;
}
.is-paused .sc-postcard { transform: none; opacity: 1; }
.is-paused .sc-box { opacity: 1; }
.is-paused .link { stroke-dashoffset: 0; opacity: 1; }
.is-paused .rev-node { transform: scale(1); opacity: 1; }
.is-paused .sc-house { transform: scale(1); opacity: 1; }
.is-paused .sc-row { transform: scaleX(0.7); opacity: 1; }
.is-paused .chart-line { stroke-dashoffset: 0; opacity: 1; }
.is-paused .chart-dot { transform: scale(1); }
.is-paused .bar { transform: scaleY(1); opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  .scene-swap-enter-active,
  .scene-swap-leave-active { transition: none; }
}
</style>
