<!-- src/components/home/HomeHero.vue -->
<script setup lang="ts">
import HeroDemoAnimation from "@/components/home/HeroDemoAnimation.vue";
import CTAButton from "@/components/marketing/CTAButton.vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

const router = useRouter();
const auth = useAuthStore();

const onStartTracking = () => {
  if (!auth.isAuthenticated) {
    auth.openLoginModal("/dashboard", "signup");
    return;
  }
  window.location.href = "/dashboard";
};

const onSeeHowItWorks = () => {
  const el = document.getElementById("features");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  router.push({ path: "/", hash: "#features" }).catch(() => {});
};

const steps = [
  { number: "01", text: "Upload your mailing list" },
  { number: "02", text: "Connect your conversion data" },
  { number: "03", text: "Get attribution and campaign guidance automatically" },
];
</script>

<template>
  <section class="relative overflow-hidden bg-[var(--mkt-bg)] pt-8 sm:pt-16 pb-16 sm:pb-28">
    <!-- Subtle background gradient -->
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(71,191,169,0.08),transparent)]"
    />

    <div
      class="relative mx-auto flex w-full max-w-[1440px] flex-col md:flex-row md:items-center md:justify-between gap-12 md:gap-16 px-4 sm:px-6 md:px-10 xl:px-16"
    >
      <!-- Left column -->
      <div class="w-full md:w-[52%] max-w-[680px] text-center md:text-left">
        <!-- Eyebrow -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :visible-once="{ opacity: 1, y: 0, transition: { duration: 500 } }"
        >
          <span
            class="inline-flex items-center rounded-full bg-[var(--mkt-teal)]/10 px-4 py-1.5 text-[13px] font-semibold tracking-wide text-[var(--mkt-teal)]"
          >
            Direct Mail Performance Platform
          </span>
        </div>

        <!-- Headline -->
        <h1
          class="mt-6 sm:mt-8 font-semibold text-[var(--mkt-text)] tracking-[-0.04em] text-[34px] sm:text-[52px] xl:text-[68px] leading-[1.08]"
          v-motion
          :initial="{ opacity: 0, y: 30 }"
          :visible-once="{ opacity: 1, y: 0, transition: { duration: 600, delay: 80 } }"
        >
          Direct mail attribution and optimization in one platform.
        </h1>

        <!-- Sub -->
        <p
          class="mt-5 sm:mt-7 text-[16px] sm:text-[19px] leading-[1.65] text-[var(--mkt-text-muted)] max-w-[560px] mx-auto md:mx-0"
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :visible-once="{ opacity: 1, y: 0, transition: { duration: 600, delay: 160 } }"
        >
          See every conversion your mail drives. Get data-backed guidance on
          where to spend next. No promo codes. No spreadsheets. No guessing.
        </p>

        <p
          class="mt-3 sm:mt-4 text-[16px] sm:text-[19px] leading-[1.65] text-[var(--mkt-text-muted)] max-w-[560px] mx-auto md:mx-0"
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :visible-once="{ opacity: 1, y: 0, transition: { duration: 600, delay: 200 } }"
        >
          Works with your current mail provider. No switching. Fast &amp; easy.
        </p>

        <!-- Steps -->
        <div
          class="mt-8 sm:mt-10 flex flex-col gap-3 sm:gap-4 items-start mx-auto md:mx-0 w-fit"
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :visible-once="{ opacity: 1, y: 0, transition: { duration: 600, delay: 240 } }"
        >
          <div
            v-for="step in steps"
            :key="step.number"
            class="flex items-start gap-3"
          >
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--mkt-teal)]/10 text-[12px] font-bold text-[var(--mkt-teal)] mt-0.5"
            >
              {{ step.number }}
            </span>
            <span class="text-[15px] sm:text-[16px] font-medium text-[var(--mkt-text)] text-left">
              {{ step.text }}
            </span>
          </div>
        </div>

        <!-- CTAs -->
        <div
          class="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center md:items-start gap-3"
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :visible-once="{ opacity: 1, y: 0, transition: { duration: 600, delay: 320 } }"
        >
          <CTAButton size="lg" @click="onStartTracking">
            Start Tracking
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </CTAButton>

          <CTAButton variant="outline" size="lg" @click="onSeeHowItWorks">
            See How It Works
          </CTAButton>
        </div>

        <!-- Proof line -->
        <p
          class="mt-6 sm:mt-8 text-[13px] sm:text-[14px] text-[var(--mkt-text-soft)] max-w-[480px] mx-auto md:mx-0"
          v-motion
          :initial="{ opacity: 0 }"
          :visible-once="{ opacity: 1, transition: { duration: 600, delay: 500 } }"
        >
          See 3-5x more attributed conversions than QR code tracking alone.
        </p>
      </div>

      <!-- Right column: hero animation card -->
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
