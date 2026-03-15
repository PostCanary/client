<!-- src/components/calculators/CalculatorHero.vue -->
<script setup lang="ts">
import type { CalculatorHeroContent } from "@/types/calculator";

defineProps<{
  content: CalculatorHeroContent;
}>();

const scrollToCalculator = () => {
  const calculator = document.getElementById("calculator");
  if (calculator) {
    calculator.scrollIntoView({ behavior: "smooth" });
  }
};
</script>

<template>
  <section class="bg-[var(--mkt-bg)]">
    <!-- HERO CONTENT -->
    <div
      class="mx-auto flex w-full max-w-[1440px] flex-col items-center text-center gap-6 px-4 sm:px-6 md:px-10 xl:px-16 pt-8 sm:pt-12 pb-12 sm:pb-16"
    >
      <h1
        class="font-normal text-[var(--mkt-text)] tracking-[-0.04em] text-[32px] sm:text-[48px] xl:text-[64px] leading-9 sm:leading-[56px] xl:leading-[72px] max-w-[900px]"
      >
        {{ content.headline }}
      </h1>

      <p
        class="text-[15px] sm:text-[18px] leading-6 sm:leading-7 font-semibold text-[var(--mkt-teal)] max-w-[700px]"
      >
        {{ content.subheadline }}
      </p>

      <button
        type="button"
        @click="scrollToCalculator"
        class="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--mkt-yellow)] px-6 sm:px-8 py-3 sm:py-3.5 text-[18px] font-semibold text-[var(--mkt-bg-alt)] shadow-[var(--mkt-card-shadow)] hover:opacity-90 cursor-pointer transition-colors"
      >
        {{ content.ctaText || "Calculate Now" }}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  </section>
</template>
