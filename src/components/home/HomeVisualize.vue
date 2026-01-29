<script setup lang="ts">
import { ref, computed } from "vue";

import image1 from "@/assets/home/dashboard_sample_image.png";
import image2 from "@/assets/home/dashboard_sample_image_2.png";
import image3 from "@/assets/home/map_leaf_sample.png";

import ellipseActive from "@/assets/home/ellipse-2-active.svg?url";
import ellipseInactive from "@/assets/home/ellipse-2-inactive.svg?url";

const slides = [
  { image: image1, alt: "MailTrace dashboard – KPIs view" },
  { image: image2, alt: "MailTrace dashboard – slide 2" },
  { image: image3, alt: "MailTrace dashboard – slide 3" },
  { image: image1, alt: "MailTrace dashboard – slide 4" },
] as const;

const inactiveDots = [
  ellipseInactive,
  ellipseInactive,
  ellipseInactive,
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
  index === currentSlide.value
    ? ellipseActive
    : inactiveDots[index - 1] ?? inactiveDots[0];
</script>

<template>
  <section class="bg-white py-24">
    <div
      class="mx-auto flex max-w-[1660px] 2xl:max-w-[1760px] flex-col items-center gap-16 px-6 md:flex-row md:px-10 xl:px-16"
    >
      <!-- LEFT: screenshot + glow + Figma ellipse dots -->
      <div class="relative flex-1">
        <!-- Card / screenshot -->
        <div
          class="relative z-10 w-full max-w-[802px] rounded-2xl bg-white shadow-[0_24px_70px_rgba(11,45,80,0.18)]"
        >
          <img
            :src="activeSlide.image"
            :alt="activeSlide.alt"
            class="block h-auto w-full"
          />
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
            class="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#47bfa9] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
          class="text-[#0b2d4f] text-[36px] leading-11 md:text-[48px] md:leading-[58px] xl:text-[70px] xl:leading-20 font-normal tracking-[-0.04em]"
        >
          Visualize Your Entire<br />
          Mail Flow in Real Time
        </h2>

        <p
          class="mt-6 text-[16px] leading-[26px] md:text-[20px] md:leading-8 text-black"
        >
          Open rates, delivery speed, and spam detection displayed on a live
          dashboard built for clarity. Everything you send. Every insight you
          need.
        </p>
      </div>
    </div>
  </section>
</template>
