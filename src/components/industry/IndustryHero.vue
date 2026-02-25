<!-- src/components/industry/IndustryHero.vue -->
<script setup lang="ts">
import type { IndustryHeroContent } from "@/types/industry";
import { BRAND } from "@/config/brand";
import landingLogo from "@/assets/postcanary-white.png";
import HeroDemoAnimation from "@/components/home/HeroDemoAnimation.vue";
import curve from "@/assets/home/curve.svg?url";
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
    }
);

const onNavSignUpLoginClick = () => {
  if (!auth.isAuthenticated) {
    auth.openLoginModal("/dashboard", "signup");
    return;
  }
  window.location.href = "/dashboard";
};

const onHeroGetStarted = () => {
  if (!auth.isAuthenticated) {
    auth.openLoginModal("/dashboard", "signup");
    return;
  }
  window.location.href = "/dashboard";
};
</script>

<template>
  <section
    class="min-h-[980px] flex flex-col"
    style="background: linear-gradient(180deg, var(--pc-navy) 0%, var(--pc-navy-2) 100%)"
  >
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

    <!-- HERO ROW -->
    <div
      class="mx-auto flex w-full max-w-[1660px] 2xl:max-w-[1760px] flex-col md:flex-row md:items-center md:justify-between gap-10 md:gap-16 px-4 sm:px-6 md:px-10 xl:px-16 2xl:px-20 pb-16 sm:pb-24 pt-2 flex-1"
    >
      <!-- LEFT COLUMN -->
      <div class="w-full md:w-[52%] max-w-[780px] text-center">
        <h1
          class="font-normal text-[var(--pc-text)] tracking-[-0.04em] text-[34px] sm:text-[56px] xl:text-[78px] leading-10 sm:leading-16 xl:leading-[90px]"
        >
          {{ content.headline }}
        </h1>

        <p
          class="mt-6 text-[15px] sm:text-[18px] leading-6 sm:leading-7 font-semibold text-[var(--pc-cyan)]"
        >
          {{ content.subheadline }}
        </p>

        <!-- Mobile-only demo animation -->
        <div class="mt-6 flex justify-center md:hidden">
          <div
            class="relative w-full max-w-[802px] overflow-hidden rounded-2xl bg-[var(--pc-card)] shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
          >
            <HeroDemoAnimation />
          </div>
        </div>

        <!-- 01 / 02 / 03 strip - Desktop -->
        <div class="mt-8 sm:mt-10 hidden md:flex flex-col items-center gap-5">
          <div class="flex items-center">
            <div
              class="flex h-10 w-10 sm:h-[45px] sm:w-[45px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--pc-cyan)] bg-[var(--pc-navy-2)] shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
            >
              <span class="text-[18px] sm:text-[20px] font-bold tracking-[0.27px] text-[var(--pc-text)]">01</span>
            </div>
            <img :src="curve" alt="" class="h-10 sm:h-[45px] w-auto" />
            <div
              class="flex h-10 w-10 sm:h-[45px] sm:w-[45px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--pc-cyan)] bg-[var(--pc-navy-2)] shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
            >
              <span class="text-[18px] sm:text-[20px] font-bold tracking-[0.27px] text-[var(--pc-text)]">02</span>
            </div>
            <img :src="curve" alt="" class="h-10 sm:h-[45px] w-auto" />
            <div
              class="flex h-10 w-10 sm:h-[45px] sm:w-[45px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--pc-cyan)] bg-[var(--pc-navy-2)] shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
            >
              <span class="text-[18px] sm:text-[20px] font-bold tracking-[0.27px] text-[var(--pc-text)]">03</span>
            </div>
          </div>

          <div
            class="grid w-full max-w-[640px] grid-cols-3 gap-2 text-[16px] sm:text-[18px] font-semibold text-[var(--pc-text)]"
          >
            <p class="text-center md:text-left">{{ steps.step1 }}</p>
            <p class="text-center md:text-left">{{ steps.step2 }}</p>
            <p class="text-center md:text-left">{{ steps.step3 }}</p>
          </div>
        </div>

        <!-- Mobile: vertical stepper -->
        <div class="mt-8 flex flex-col gap-4 md:hidden">
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--pc-cyan)] bg-[var(--pc-navy-2)] shadow-[0_4px_14px_rgba(0,0,0,0.35)] shrink-0">
              <span class="text-[18px] font-bold tracking-[0.27px] text-[var(--pc-text)]">01</span>
            </div>
            <p class="text-[16px] font-semibold text-[var(--pc-text)]">{{ steps.step1 }}</p>
          </div>
          <div class="ml-5 h-6 border-l border-dashed border-[var(--pc-cyan)]" />
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--pc-cyan)] bg-[var(--pc-navy-2)] shadow-[0_4px_14px_rgba(0,0,0,0.35)] shrink-0">
              <span class="text-[18px] font-bold tracking-[0.27px] text-[var(--pc-text)]">02</span>
            </div>
            <p class="text-[16px] font-semibold text-[var(--pc-text)]">{{ steps.step2 }}</p>
          </div>
          <div class="ml-5 h-6 border-l border-dashed border-[var(--pc-cyan)]" />
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--pc-cyan)] bg-[var(--pc-navy-2)] shadow-[0_4px_14px_rgba(0,0,0,0.35)] shrink-0">
              <span class="text-[18px] font-bold tracking-[0.27px] text-[var(--pc-text)]">03</span>
            </div>
            <p class="text-[16px] font-semibold text-[var(--pc-text)]">{{ steps.step3 }}</p>
          </div>
        </div>

        <!-- Get Started CTA -->
        <div class="mt-8 sm:mt-10 flex justify-center">
          <button
            type="button"
            @click="onHeroGetStarted"
            class="inline-flex items-center gap-3 rounded-lg bg-[var(--pc-yellow)] px-6 sm:px-8 py-3 sm:py-3.5 text-[18px] font-semibold text-[var(--pc-navy)] shadow-md hover:opacity-90 cursor-pointer"
          >
            Get Started
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.9331 21.0667C8.56698 20.7006 8.56698 20.107 8.9331 19.7409L19.5581 9.11588C19.9243 8.74975 20.5178 8.74975 20.8839 9.11588C21.25 9.482 21.25 10.0756 20.8839 10.4418L10.2589 21.0667C9.8928 21.4328 9.29922 21.4328 8.9331 21.0667Z" fill="currentColor"/>
              <path d="M8.03345 9.77876C8.03345 9.26101 8.45317 8.84126 8.97095 8.84126L20.221 8.84126C20.7387 8.84126 21.1585 9.26101 21.1585 9.77876L21.1585 21.0288C21.1585 21.5466 20.7387 21.9663 20.221 21.9663C19.7031 21.9663 19.2835 21.5466 19.2835 21.0288L19.2835 10.7163L8.97095 10.7163C8.45317 10.7163 8.03345 10.2966 8.03345 9.77876Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- RIGHT COLUMN: demo animation (desktop only) -->
      <div
        class="hidden md:flex w-full md:w-[48%] justify-center md:justify-end mb-4 md:mb-0"
      >
        <div
          class="relative w-full max-w-[802px] overflow-hidden rounded-2xl bg-[var(--pc-card)] shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
        >
          <HeroDemoAnimation />
        </div>
      </div>
    </div>
  </section>
</template>
