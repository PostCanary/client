<!-- src/components/marketing/sections/HeroSection.vue -->
<!-- POS-222 marketing hero. The .hero-media layer is the future looping-video
     slot (POS-228): drop a <video> there with the gradient as poster; the
     gradient stays as the no-video / reduced-data fallback. -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

// Exact pairs from the Website Flow mockup — both words cycle like a slot machine.
const PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["PostCanary", "Everyone"],
  ["PostCanary", "Roofers"],
  ["PostCanary", "Restaurants"],
  ["PostCanary", "Plumbers"],
  ["EDDM", "Everyone"],
  ["Targeted Mail", "Everyone"],
  ["Analytics", "Everyone"],
];

const products = PAIRS.map(([p]) => p);
const audiences = PAIRS.map(([, a]) => a);

const index = ref(0);
const reduceMotion = ref(false);
// Background loop stays off for reduced-motion and data-saver visitors; the
// gradient + poster carry the hero on their own.
const showVideo = ref(false);
let timer: number | undefined;

onMounted(() => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  reduceMotion.value = mq.matches;
  mq.addEventListener?.("change", (e) => {
    reduceMotion.value = e.matches;
    if (e.matches) showVideo.value = false;
  });

  const saveData = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection?.saveData;
  showVideo.value = !reduceMotion.value && saveData !== true;

  if (!reduceMotion.value) {
    timer = window.setInterval(() => {
      index.value = (index.value + 1) % PAIRS.length;
    }, 2600);
  }
});

onBeforeUnmount(() => {
  if (timer !== undefined) window.clearInterval(timer);
});

const reelStyle = computed(() => ({
  transform: `translateY(calc(${-index.value} * var(--hero-line)))`,
}));

function getStarted() {
  auth.openLoginModal("/app/home", "signup");
}
</script>

<template>
  <section
    id="hero"
    class="mkt-anchor-section hero"
    aria-labelledby="hero-heading"
    tabindex="-1"
  >
    <!-- POS-228 background loop; the gradient below is the load/fallback state. -->
    <div class="hero-media" aria-hidden="true"></div>
    <video
      v-if="showVideo"
      class="hero-video"
      poster="/hero/hero-poster.jpg"
      autoplay
      muted
      loop
      playsinline
      preload="metadata"
      aria-hidden="true"
      tabindex="-1"
    >
      <source src="/hero/hero-loop.mp4" type="video/mp4" />
    </video>
    <div class="hero-scrim" aria-hidden="true"></div>

    <div
      class="relative mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 px-4 py-28 sm:px-6 sm:py-36 md:px-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16 xl:px-16"
    >
      <div class="flex flex-col items-start">
        <h1 id="hero-heading" class="hero-headline">
          <!-- Static accessible name; the animated reels are decorative duplicates. -->
          <span class="sr-only">PostCanary for Everyone</span>
          <span class="hero-reel" aria-hidden="true">
            <span
              class="hero-reel-track"
              :class="{ 'hero-reel-static': reduceMotion }"
              :style="reduceMotion ? undefined : reelStyle"
            >
              <span v-for="(word, i) in products" :key="i" class="hero-word">{{
                word
              }}</span>
            </span>
          </span>
          <span class="hero-line-2" aria-hidden="true">
            <span class="hero-for">for</span>
            <span class="hero-reel">
              <span
                class="hero-reel-track"
                :class="{ 'hero-reel-static': reduceMotion }"
                :style="reduceMotion ? undefined : reelStyle"
              >
                <span v-for="(word, i) in audiences" :key="i" class="hero-word">{{
                  word
                }}</span>
              </span>
            </span>
          </span>
        </h1>

        <button type="button" class="hero-cta" @click="getStarted">
          Get Started
        </button>
      </div>

      <!-- Right column stays empty on purpose: it is the clear area where the
           POS-228 background loop reads through behind the headline block. -->
      <div class="hidden lg:block" aria-hidden="true"></div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  background: var(--pc-navy);
  color: var(--pc-white);
  /* One reel line; every slot metric derives from this. */
  --hero-line: clamp(3.25rem, 9vw, 6.5rem);
}

.hero-media {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(52rem 30rem at 82% 8%, rgba(38, 175, 163, 0.34), transparent 62%),
    radial-gradient(46rem 28rem at 12% 92%, rgba(250, 207, 65, 0.26), transparent 60%),
    radial-gradient(34rem 22rem at 55% 55%, rgba(38, 175, 163, 0.14), transparent 65%),
    var(--pc-navy);
}

@media (prefers-reduced-motion: no-preference) {
  .hero-media {
    animation: hero-drift 18s ease-in-out infinite alternate;
  }
  @keyframes hero-drift {
    from {
      transform: scale(1) translate3d(0, 0, 0);
    }
    to {
      transform: scale(1.12) translate3d(-2%, 2%, 0);
    }
  }
}

.hero-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Keeps headline contrast over the footage: heaviest where the type sits. */
.hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    rgba(28, 36, 48, 0.94) 0%,
    rgba(28, 36, 48, 0.82) 34%,
    rgba(28, 36, 48, 0.5) 68%,
    rgba(28, 36, 48, 0.38) 100%
  );
}

.hero-headline {
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
  font-size: var(--hero-line);
}

.hero-line-2 {
  display: flex;
  align-items: baseline;
  gap: 0.35em;
}

.hero-for {
  color: var(--pc-white);
  font-weight: 400;
}

/* Slot-machine reel: fixed one-line mask, the track rolls vertically. */
.hero-reel {
  display: inline-block;
  height: var(--hero-line);
  max-width: 100%;
  overflow: hidden;
  vertical-align: bottom;
}

.hero-reel-track {
  display: flex;
  flex-direction: column;
  width: max-content;
  transition: transform 620ms cubic-bezier(0.3, 1.25, 0.4, 1);
}

.hero-reel-static {
  transform: none;
}

.hero-word {
  display: block;
  height: var(--hero-line);
  line-height: var(--hero-line);
  color: var(--pc-canary);
  white-space: nowrap;
}

.hero-cta {
  margin-top: 2.75rem;
  border-radius: 9999px;
  background: var(--pc-canary);
  color: var(--pc-navy);
  font-weight: 700;
  font-size: 1.125rem;
  padding: 0.9rem 2.4rem;
  transition: transform 150ms ease, box-shadow 150ms ease;
  box-shadow: 0 6px 24px rgba(250, 207, 65, 0.28);
}

.hero-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 32px rgba(250, 207, 65, 0.4);
}

.hero-cta:focus-visible {
  outline: 3px solid var(--pc-white);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .hero-cta {
    transition: none;
  }
}
</style>
