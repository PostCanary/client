<!-- src/components/marketing/ScrollStory.vue -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from "vue";

export interface StoryStep {
  id: string;
  /** Short step label (e.g. "01 — Send"). */
  kicker: string;
  title: string;
  body: string;
  icon: Component;
}

const props = defineProps<{
  steps: StoryStep[];
}>();

const activeIndex = ref(0);
const stepEls = ref<HTMLElement[]>([]);
const reduceMotion = ref(false);
let observer: IntersectionObserver | null = null;

function setStepRef(el: Element | null, index: number) {
  if (el instanceof HTMLElement) stepEls.value[index] = el;
}

onMounted(() => {
  reduceMotion.value = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // The step whose block crosses the viewport's middle band owns the visual.
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const idx = stepEls.value.findIndex((el) => el === entry.target);
        if (idx !== -1) activeIndex.value = idx;
      }
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
  );
  for (const el of stepEls.value) observer.observe(el);
});

onBeforeUnmount(() => observer?.disconnect());

const activeStep = computed(() => props.steps[activeIndex.value]);
</script>

<template>
  <div class="scroll-story" :class="{ 'is-static': reduceMotion }">
    <!-- Sticky visual panel (desktop). Static fallback stacks below content. -->
    <div class="scroll-story__visual-wrap">
      <div class="scroll-story__visual" aria-hidden="true">
        <Transition name="story-swap" mode="out-in">
          <div v-if="activeStep" :key="activeStep.id" class="scroll-story__visual-inner">
            <component :is="activeStep.icon" class="scroll-story__icon" />
            <p class="scroll-story__visual-kicker">{{ activeStep.kicker }}</p>
            <p class="scroll-story__visual-title">{{ activeStep.title }}</p>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Step column -->
    <div class="scroll-story__steps">
      <div
        v-for="(step, index) in props.steps"
        :key="step.id"
        :ref="(el) => setStepRef(el as Element | null, index)"
        class="scroll-story__step"
        :class="{ 'is-active': index === activeIndex }"
      >
        <p class="scroll-story__kicker">{{ step.kicker }}</p>
        <h3 class="scroll-story__title">{{ step.title }}</h3>
        <p class="scroll-story__body">{{ step.body }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scroll-story {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
}

@media (min-width: 1024px) {
  .scroll-story {
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    gap: 4rem;
    align-items: start;
  }
}

/* Sticky visual — pins on desktop, hidden on mobile (steps carry the story). */
.scroll-story__visual-wrap {
  display: none;
}
@media (min-width: 1024px) {
  .scroll-story__visual-wrap {
    display: block;
    position: sticky;
    top: calc(var(--mkt-nav-height, 4.75rem) + 2rem);
  }
}
/* Reduced-motion: no pin, visual still shows current step without swap. */
.scroll-story.is-static .scroll-story__visual-wrap {
  position: static;
}

.scroll-story__visual {
  aspect-ratio: 4 / 3;
  border-radius: var(--mkt-card-radius);
  background:
    radial-gradient(
      110% 90% at 15% 0%,
      color-mix(in srgb, var(--pc-teal-brand) 32%, transparent) 0%,
      transparent 60%
    ),
    radial-gradient(
      90% 80% at 90% 100%,
      color-mix(in srgb, var(--pc-canary) 20%, transparent) 0%,
      transparent 58%
    ),
    linear-gradient(
      150deg,
      var(--pc-navy) 0%,
      color-mix(in srgb, var(--pc-navy) 70%, var(--pc-teal-brand)) 100%
    );
  box-shadow: var(--mkt-card-shadow-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.scroll-story__visual-inner {
  text-align: center;
  padding: 2rem;
  color: var(--pc-white);
}

.scroll-story__icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1.25rem;
  color: var(--pc-canary);
  stroke-width: 1.5;
}

.scroll-story__visual-kicker {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--pc-canary) 85%, white);
  margin: 0 0 0.5rem;
}

.scroll-story__visual-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
}

/* Steps */
.scroll-story__steps {
  display: flex;
  flex-direction: column;
  gap: 4.5rem;
}
@media (min-width: 1024px) {
  .scroll-story__steps {
    gap: 9rem;
    padding: 4rem 0;
  }
}

.scroll-story__step {
  opacity: 0.45;
  transition: opacity 0.35s ease;
}
.scroll-story__step.is-active {
  opacity: 1;
}
.scroll-story.is-static .scroll-story__step {
  opacity: 1;
}

.scroll-story__kicker {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--pc-teal-brand);
  margin: 0 0 0.6rem;
}

.scroll-story__title {
  font-size: 1.65rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--mkt-text);
  margin: 0 0 0.85rem;
  line-height: 1.2;
}

.scroll-story__body {
  font-size: 1.0625rem;
  line-height: 1.7;
  color: var(--mkt-text-muted);
  margin: 0;
}

/* Visual swap transition */
.story-swap-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.story-swap-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.story-swap-enter-from {
  opacity: 0;
  transform: translateY(14px);
}
.story-swap-leave-to {
  opacity: 0;
  transform: translateY(-14px);
}
@media (prefers-reduced-motion: reduce) {
  .story-swap-enter-active,
  .story-swap-leave-active,
  .scroll-story__step {
    transition: none;
  }
}
</style>
