<!-- src/components/marketing/sections/HeroSection.vue -->
<!-- POS-222 marketing hero. The .hero-media layer is the future looping-video
     slot (POS-228): drop a <video> there with the gradient as poster; the
     gradient stays as the no-video / reduced-data fallback. -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { captureEvent } from "@/composables/usePostHog";

const auth = useAuthStore();

const AUDIENCES = [
  "Auto dealerships",
  "Non-profits",
  "Restaurants",
  "Home service",
  "Health clubs",
] as const;

const audienceReel = [...AUDIENCES, AUDIENCES[0]];

const index = ref(0);
const skipTransition = ref(false);
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
      if (skipTransition.value) return;
      index.value += 1;
    }, 2600);
  }
});

onBeforeUnmount(() => {
  if (timer !== undefined) window.clearInterval(timer);
});

const reelStyle = computed(() => ({
  transform: `translateY(${(-index.value / audienceReel.length) * 100}%)`,
}));

function onReelTransitionEnd(event: TransitionEvent) {
  if (event.propertyName !== "transform") return;
  if (event.target !== event.currentTarget) return;
  if (index.value !== AUDIENCES.length) return;
  skipTransition.value = true;
  index.value = 0;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      skipTransition.value = false;
    });
  });
}

function getStarted() {
  captureEvent("marketing_cta_clicked", { cta: "get_started", section: "hero" });
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
          <span class="sr-only">PostCanary for auto dealerships, non-profits, restaurants, home service, and health clubs</span>
          <span class="hero-kicker" aria-hidden="true">
            <span class="hero-brand">PostCanary</span>
            <span class="hero-for">for</span>
          </span>
          <span class="hero-reel" aria-hidden="true">
            <span
              class="hero-reel-track"
              :class="{
                'hero-reel-static': reduceMotion,
                'hero-reel-jump': skipTransition,
              }"
              :style="reduceMotion ? undefined : reelStyle"
              @transitionend="onReelTransitionEnd"
            >
              <span
                v-for="(word, i) in audienceReel"
                :key="`${word}-${i}`"
                class="hero-word"
                >{{ word }}</span
              >
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
  --hero-line: clamp(2.05rem, 6.2vw, 5.25rem);
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
  --hero-slot: 1.7em;
  line-height: var(--hero-slot);
  font-size: var(--hero-line);
  max-width: 100%;
}

.hero-kicker {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 0.35em;
}

.hero-brand {
  color: var(--pc-canary);
}

.hero-for {
  color: var(--pc-white);
  font-weight: 400;
}

/* Vertical-only mask. overflow:hidden on y would coerce overflow-x to
   auto and clip long labels. Negative x inset keeps those labels whole. */
.hero-reel {
  display: block;
  height: var(--hero-slot);
  overflow: visible;
  isolation: isolate;
  clip-path: inset(0 -100vw);
}

.hero-reel-track {
  display: flex;
  flex-direction: column;
  width: max-content;
  max-width: 100%;
  transition: transform 620ms cubic-bezier(0.22, 1, 0.36, 1);
}

.hero-reel-static,
.hero-reel-jump {
  transition: none;
}

.hero-word {
  display: flex;
  align-items: center;
  flex: 0 0 var(--hero-slot);
  box-sizing: border-box;
  height: var(--hero-slot);
  color: var(--pc-canary);
  white-space: nowrap;
  line-height: 1.15;
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
