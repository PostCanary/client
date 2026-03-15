<!-- src/components/industry/IndustryHero.vue -->
<script setup lang="ts">
import type { IndustryHeroContent } from "@/types/industry";
import HeroDemoAnimation from "@/components/home/HeroDemoAnimation.vue";
import CTAButton from "@/components/marketing/CTAButton.vue";
import { useAuthStore } from "@/stores/auth";
import { computed } from "vue";

const props = defineProps<{
  content: IndustryHeroContent;
}>();

const auth = useAuthStore();

const steps = computed(
  () =>
    props.content.steps ?? {
      step1: "Sign Up / Login",
      step2: "Upload Your CSV",
      step3: "Review KPIs & Trends",
    },
);

const onHeroGetStarted = () => {
  if (!auth.isAuthenticated) {
    auth.openLoginModal("/dashboard", "signup");
    return;
  }
  window.location.href = "/dashboard";
};
</script>

<template>
  <section class="relative overflow-hidden bg-[var(--mkt-bg)] pt-8 sm:pt-16 pb-16 sm:pb-24">
    <!-- Subtle background gradient -->
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(71,191,169,0.08),transparent)]"
    />

    <div
      class="relative mx-auto flex w-full max-w-[1440px] flex-col md:flex-row md:items-center md:justify-between gap-10 md:gap-16 px-4 sm:px-6 md:px-10 xl:px-16"
    >
      <!-- Left column -->
      <div
        class="w-full md:w-[52%] max-w-[680px] text-center md:text-left"
        v-motion
        :initial="{ opacity: 0, y: 30 }"
        :visible-once="{ opacity: 1, y: 0, transition: { duration: 600 } }"
      >
        <h1
          class="font-semibold text-[var(--mkt-text)] tracking-[-0.04em] text-[32px] sm:text-[48px] xl:text-[64px] leading-[1.1]"
        >
          {{ content.headline }}
        </h1>

        <p
          class="mt-5 sm:mt-6 text-[16px] sm:text-[18px] leading-relaxed text-[var(--mkt-text-muted)]"
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :visible-once="{ opacity: 1, y: 0, transition: { duration: 600, delay: 100 } }"
        >
          {{ content.subheadline }}
        </p>

        <!-- Steps -->
        <div
          class="mt-8 sm:mt-10 flex flex-col gap-3 items-center md:items-start"
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :visible-once="{ opacity: 1, y: 0, transition: { duration: 600, delay: 200 } }"
        >
          <div class="flex items-center gap-3">
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--mkt-teal)]/10 text-[12px] font-bold text-[var(--mkt-teal)]">01</span>
            <span class="text-[15px] sm:text-[16px] font-medium text-[var(--mkt-text)]">{{ steps.step1 }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--mkt-teal)]/10 text-[12px] font-bold text-[var(--mkt-teal)]">02</span>
            <span class="text-[15px] sm:text-[16px] font-medium text-[var(--mkt-text)]">{{ steps.step2 }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--mkt-teal)]/10 text-[12px] font-bold text-[var(--mkt-teal)]">03</span>
            <span class="text-[15px] sm:text-[16px] font-medium text-[var(--mkt-text)]">{{ steps.step3 }}</span>
          </div>
        </div>

        <!-- CTA -->
        <div
          class="mt-8 sm:mt-10 flex justify-center md:justify-start"
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :visible-once="{ opacity: 1, y: 0, transition: { duration: 600, delay: 300 } }"
        >
          <CTAButton size="lg" @click="onHeroGetStarted">
            Start Tracking
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </CTAButton>
        </div>
      </div>

      <!-- Right column: demo animation -->
      <div
        class="w-full md:w-[48%] flex justify-center md:justify-end"
        v-motion
        :initial="{ opacity: 0, x: 40 }"
        :visible-once="{ opacity: 1, x: 0, transition: { duration: 700, delay: 300 } }"
      >
        <div
          class="relative w-full max-w-[700px] rounded-2xl bg-[var(--mkt-card)] border border-[var(--mkt-border)] shadow-[var(--mkt-card-shadow-lg)]"
        >
          <HeroDemoAnimation />
        </div>
      </div>
    </div>
  </section>
</template>
