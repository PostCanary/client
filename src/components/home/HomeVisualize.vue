<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

import image1 from "@/assets/home/dashboard_sample_image.png";
import image2 from "@/assets/home/dashboard_sample_image_2.png";
import image3 from "@/assets/home/map_leaf_sample.png";

import ellipseActive from "@/assets/home/ellipse-2-active.svg?url";
import ellipseInactive from "@/assets/home/ellipse-2-inactive.svg?url";

const slides = [
  { image: image1, alt: "PostCanary KPI dashboard" },
  { image: image2, alt: "PostCanary performance metrics" },
  { image: image3, alt: "PostCanary geographic heatmap" },
] as const;

const currentSlide = ref(0);

const activeSlide = computed(() => {
  const slide = slides[currentSlide.value];
  return slide ?? slides[0];
});

const goToSlide = (index: number) => {
  if (index >= 0 && index < slides.length) currentSlide.value = index;
};

const dotIconFor = (index: number) =>
  index === currentSlide.value ? ellipseActive : ellipseInactive;

// Auto-play: advance every 5 seconds, pause on hover/focus
let autoPlayTimer: ReturnType<typeof setInterval> | null = null;

const startAutoPlay = () => {
  if (autoPlayTimer) return;
  autoPlayTimer = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % slides.length;
  }, 5000);
};

const stopAutoPlay = () => {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }
};

onMounted(() => startAutoPlay());
onUnmounted(() => stopAutoPlay());
</script>

<template>
  <section class="bg-[var(--pc-navy-2)] py-24">
    <div
      class="mx-auto flex max-w-[1660px] 2xl:max-w-[1760px] flex-col items-center gap-16 px-6 md:flex-row md:px-10 xl:px-16"
    >
      <!-- LEFT: screenshot + glow + Figma ellipse dots -->
      <div
        class="relative flex-1"
        @mouseenter="stopAutoPlay"
        @mouseleave="startAutoPlay"
        @focusin="stopAutoPlay"
        @focusout="startAutoPlay"
      >
        <!-- Card / screenshot -->
        <div
          class="relative z-10 w-full max-w-[802px] rounded-2xl bg-[var(--pc-card)] shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
        >
          <Transition name="fade" mode="out-in">
            <img
              :key="currentSlide"
              :src="activeSlide.image"
              :alt="activeSlide.alt"
              class="block h-auto w-full"
            />
          </Transition>
        </div>

        <!-- Figma ellipse dots (clickable) -->
        <div
          class="mt-10 flex items-center justify-center gap-4"
          aria-label="Visualize dashboard slides"
        >
          <button
            v-for="(_, index) in slides"
            :key="index"
            type="button"
            class="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pc-navy-2)]"
            :aria-label="`Go to slide ${index + 1}`"
            :aria-current="currentSlide === index"
            @click="goToSlide(index)"
          >
            <img :src="dotIconFor(index)" alt="" class="h-[11px] w-[11px]" />
          </button>
        </div>
      </div>

      <!-- RIGHT: text column -->
      <div class="flex-1 max-w-[652px]">
        <h2
          class="text-[var(--pc-text)] text-[36px] leading-11 md:text-[48px] md:leading-[58px] xl:text-[70px] xl:leading-20 font-normal tracking-[-0.04em]"
        >
          Visualize Your Entire<br />
          Mail Flow in Real Time
        </h2>

        <p
          class="mt-6 text-[16px] leading-[26px] md:text-[20px] md:leading-8 text-[var(--pc-text-muted)]"
        >
          Open rates, delivery speed, and spam detection displayed on a live
          dashboard built for clarity. Everything you send. Every insight you
          need.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 300ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
