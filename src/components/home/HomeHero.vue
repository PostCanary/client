<!-- src/components/home/HomeHero.vue -->
<script setup lang="ts">
import HeroDemoAnimation from "@/components/home/HeroDemoAnimation.vue";
import landingLogo from "@/assets/postcanary-white.png";

import curve from "@/assets/home/curve.svg?url";
import rightDown from "@/assets/home/right-down.svg?url";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { BRAND } from "@/config/brand";

const router = useRouter();
const auth = useAuthStore();

/**
 * Top-right "Sign Up" button in the navbar.
 * - If not authenticated → open modal (default to signup view)
 * - If authenticated      → send them to the dashboard
 */
const onNavSignUpLoginClick = () => {
  if (!auth.isAuthenticated) {
    auth.openLoginModal("/dashboard", "signup");
    return;
  }

  // Already logged in → go to dashboard
  window.location.href = "/dashboard";
};

/**
 * Hero "Get Started" button:
 * Prefer pushing user down to pricing section (#pricing).
 * If pricing section is not mounted (different route), fall back to routing with hash.
 */
const onHeroGetStarted = () => {
  const el = document.getElementById("pricing");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  // Fallback: if user is on some other route and pricing is on "/"
  router.push({ path: "/", hash: "#pricing" }).catch(() => {
    /* ignore duplicate nav */
  });
};
</script>

<template>
  <section
    class="bg-[linear-gradient(180deg,var(--pc-navy)_0%,var(--pc-navy-2)_100%)] min-h-[980px] flex flex-col pt-0"
  >
    <!-- NAVBAR -->
    <header
      class="mx-auto flex w-full max-w-[1660px] 2xl:max-w-[1760px] items-center justify-between px-4 sm:px-6 md:px-10 xl:px-16 2xl:px-20 pt-0 pb-1"
    >
      <!-- logo -->
      <div class="flex items-center gap-2">
        <img
          :src="landingLogo"
          :alt="BRAND.name"
          class="h-[clamp(180px,20vw,260px)] w-auto"
        />
      </div>

      <!-- top-right CTAs -->
      <div class="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          class="rounded-lg bg-[var(--pc-yellow)] px-4 sm:px-6 py-1.5 sm:py-2 text-[16px] sm:text-[20px] font-semibold text-[var(--pc-navy)] shadow-sm hover:opacity-90 cursor-pointer"
          @click="onNavSignUpLoginClick"
        >
          Sign Up
        </button>

        <!-- Book a Demo -> Calendly link -->
        <a
          :href="BRAND.links.demo"
          target="_blank"
          rel="noopener noreferrer"
          class="hidden rounded-lg border border-[var(--pc-cyan)] px-4 sm:px-6 py-1.5 sm:py-2 text-[16px] sm:text-[20px] font-semibold text-[var(--pc-cyan)] shadow-sm hover:bg-[var(--pc-cyan)] hover:text-[var(--pc-navy)] md:inline-flex"
        >
          Book a Demo
        </a>
      </div>
    </header>

    <!-- HERO ROW -->
    <div
      class="mx-auto flex w-full max-w-[1660px] 2xl:max-w-[1760px] flex-col md:flex-row md:items-center md:justify-between gap-10 md:gap-16 px-4 sm:px-6 md:px-10 xl:px-16 2xl:px-20 pb-16 sm:pb-24 pt-0 flex-1"
    >
      <!-- LEFT COLUMN -->
      <div class="w-full md:w-[52%] max-w-[780px] text-center">
        <h1
          class="font-normal text-[var(--pc-text)] tracking-[-0.04em] text-[34px] sm:text-[56px] xl:text-[78px] leading-10 sm:leading-16 xl:leading-[90px]"
        >
          Finally you can see how your direct mail performs
        </h1>

        <p
          class="mt-6 text-[15px] sm:text-[18px] leading-6 sm:leading-7 font-semibold text-[var(--pc-cyan)]"
        >
          QR codes and promo codes only track the people who use them. That's 10-30% of your direct mail conversions, at best. PostCanary tracks the rest.
        </p>

        <!-- Mobile-only hero animation -->
        <div class="mt-6 flex justify-center md:hidden">
          <div
            class="relative w-full max-w-[802px] rounded-2xl bg-[var(--pc-card)] shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
          >
            <HeroDemoAnimation />
          </div>
        </div>

        <!-- 01 / 02 / 03 strip -->
        <!-- Desktop / tablet: horizontal circles + curves + labels -->
        <div class="mt-8 sm:mt-10 hidden md:flex flex-col items-center gap-5">
          <div class="flex items-center">
            <!-- 01 -->
            <div
              class="flex h-10 w-10 sm:h-[45px] sm:w-[45px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--pc-cyan)] bg-[var(--pc-navy-2)] shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
            >
              <span
                class="text-[18px] sm:text-[20px] font-bold tracking-[0.27px] text-[var(--pc-text)]"
              >
                01
              </span>
            </div>

            <img :src="curve" alt="" class="h-10 sm:h-[45px] w-auto" />

            <!-- 02 -->
            <div
              class="flex h-10 w-10 sm:h-[45px] sm:w-[45px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--pc-cyan)] bg-[var(--pc-navy-2)] shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
            >
              <span
                class="text-[18px] sm:text-[20px] font-bold tracking-[0.27px] text-[var(--pc-text)]"
              >
                02
              </span>
            </div>

            <img :src="curve" alt="" class="h-10 sm:h-[45px] w-auto" />

            <!-- 03 -->
            <div
              class="flex h-10 w-10 sm:h-[45px] sm:w-[45px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--pc-cyan)] bg-[var(--pc-navy-2)] shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
            >
              <span
                class="text-[18px] sm:text-[20px] font-bold tracking-[0.27px] text-[var(--pc-text)]"
              >
                03
              </span>
            </div>
          </div>

          <div
            class="grid w-full max-w-[640px] grid-cols-3 gap-2 text-[16px] sm:text-[18px] font-semibold text-[var(--pc-text)]"
          >
            <div class="relative group text-center md:text-left cursor-pointer">
              <span>Sign Up</span>
            </div>

            <p class="text-center md:text-left">Upload Your CSV</p>
            <p class="text-center md:text-left">Review KPIs &amp; Trends</p>
          </div>
        </div>

        <!-- Mobile: vertical stepper with circles + dashed connector -->
        <div class="mt-8 flex flex-col gap-4 md:hidden">
          <!-- Step 1 -->
          <div class="flex items-center gap-4">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--pc-cyan)] bg-[var(--pc-navy-2)] shadow-[0_4px_14px_rgba(0,0,0,0.35)] shrink-0"
            >
              <span
                class="text-[18px] font-bold tracking-[0.27px] text-[var(--pc-text)]"
              >
                01
              </span>
            </div>
            <div class="relative group text-left">
              <span class="text-[16px] font-semibold text-[var(--pc-text)]">
                Sign Up
              </span>
            </div>
          </div>

          <!-- connector -->
          <div class="ml-5 h-6 border-l border-dashed border-[var(--pc-cyan)]" />

          <!-- Step 2 -->
          <div class="flex items-center gap-4">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--pc-cyan)] bg-[var(--pc-navy-2)] shadow-[0_4px_14px_rgba(0,0,0,0.35)] shrink-0"
            >
              <span
                class="text-[18px] font-bold tracking-[0.27px] text-[var(--pc-text)]"
              >
                02
              </span>
            </div>
            <p class="text-[16px] font-semibold text-[var(--pc-text)]">
              Upload Your CSV
            </p>
          </div>

          <!-- connector -->
          <div class="ml-5 h-6 border-l border-dashed border-[var(--pc-cyan)]" />

          <!-- Step 3 -->
          <div class="flex items-center gap-4">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--pc-cyan)] bg-[var(--pc-navy-2)] shadow-[0_4px_14px_rgba(0,0,0,0.35)] shrink-0"
            >
              <span
                class="text-[18px] font-bold tracking-[0.27px] text-[var(--pc-text)]"
              >
                03
              </span>
            </div>
            <p class="text-[16px] font-semibold text-[var(--pc-text)]">
              Review KPIs &amp; Trends
            </p>
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
            <img :src="rightDown" alt="" class="h-[26px] sm:h-28px" />
          </button>
        </div>
      </div>

      <!-- RIGHT COLUMN: hero animation card (desktop/tablet only) -->
      <div
        class="hidden md:flex w-full md:w-[48%] justify-center md:justify-end mb-4 md:mb-0"
      >
        <div
          class="relative w-full max-w-[802px] rounded-2xl bg-[var(--pc-card)] shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
        >
          <HeroDemoAnimation />
        </div>
      </div>
    </div>
  </section>
</template>
