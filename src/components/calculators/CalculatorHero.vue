<!-- src/components/calculators/CalculatorHero.vue -->
<script setup lang="ts">
import type { CalculatorHeroContent } from "@/types/calculator";
import { BRAND } from "@/config/brand";
import landingLogo from "@/assets/postcanary-white.png";
import { useAuthStore } from "@/stores/auth";

defineProps<{
  content: CalculatorHeroContent;
}>();

const auth = useAuthStore();

const onNavSignUpLoginClick = () => {
  if (!auth.isAuthenticated) {
    auth.openLoginModal("/dashboard", "signup");
    return;
  }
  window.location.href = "/dashboard";
};

const scrollToCalculator = () => {
  const calculator = document.getElementById("calculator");
  if (calculator) {
    calculator.scrollIntoView({ behavior: "smooth" });
  }
};
</script>

<template>
  <section class="bg-[var(--pc-navy)] min-h-[480px] flex flex-col">
    <!-- NAVBAR -->
    <header
      class="mx-auto flex w-full max-w-[1660px] 2xl:max-w-[1760px] items-center justify-between px-4 sm:px-6 md:px-10 xl:px-16 2xl:px-20 pt-0 pb-1"
    >
      <div class="flex items-center gap-2">
        <a href="/">
          <img
            :src="landingLogo"
            :alt="BRAND.name"
            class="h-[clamp(220px,24vw,320px)] w-auto -my-[clamp(60px,6.5vw,90px)]"
          />
        </a>
      </div>

      <div class="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          class="rounded-lg bg-[var(--pc-yellow)] px-4 sm:px-6 py-1.5 sm:py-2 text-[16px] sm:text-[20px] font-semibold text-[var(--pc-navy)] shadow-sm hover:opacity-90 cursor-pointer"
          @click="onNavSignUpLoginClick"
        >
          Sign Up / Login
        </button>

        <a
          :href="BRAND.links.demo"
          target="_blank"
          rel="noopener noreferrer"
          class="hidden rounded-lg border border-[var(--pc-cyan)] px-4 sm:px-6 py-1.5 sm:py-2 text-[16px] sm:text-[20px] font-semibold text-[var(--pc-cyan)] shadow-sm hover:bg-[var(--pc-cyan)]/10 md:inline-flex"
        >
          Book a Demo
        </a>
      </div>
    </header>

    <!-- HERO CONTENT -->
    <div
      class="mx-auto flex w-full max-w-[1660px] 2xl:max-w-[1760px] flex-col items-center text-center gap-6 px-4 sm:px-6 md:px-10 xl:px-16 2xl:px-20 pb-16 sm:pb-20 pt-2 flex-1"
    >
      <h1
        class="font-normal text-[var(--pc-text)] tracking-[-0.04em] text-[32px] sm:text-[48px] xl:text-[64px] leading-9 sm:leading-[56px] xl:leading-[72px] max-w-[900px]"
      >
        {{ content.headline }}
      </h1>

      <p
        class="text-[15px] sm:text-[18px] leading-6 sm:leading-7 font-semibold text-[var(--pc-cyan)] max-w-[700px]"
      >
        {{ content.subheadline }}
      </p>

      <button
        type="button"
        @click="scrollToCalculator"
        class="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--pc-yellow)] px-6 sm:px-8 py-3 sm:py-3.5 text-[18px] font-semibold text-[var(--pc-navy)] shadow-md hover:opacity-90 cursor-pointer transition-colors"
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
