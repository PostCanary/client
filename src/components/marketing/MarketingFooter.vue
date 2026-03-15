<!-- src/components/marketing/MarketingFooter.vue -->
<script setup lang="ts">
import { BRAND, getCopyrightText, getSupportEmailLink } from "@/config/brand";
import landingLogo from "@/assets/postcanary-white.png";
import linkedinIcon from "@/assets/home/linkedin-icon.svg?url";
</script>

<template>
  <footer class="bg-[var(--mkt-navy)]">
    <!-- Top content row -->
    <div
      class="mx-auto flex w-full max-w-[1440px] flex-col md:flex-row items-center md:items-start justify-center md:justify-between gap-10 md:gap-16 px-4 sm:px-6 md:px-10 xl:px-16 pt-12 pb-10 md:pt-16 md:pb-12"
    >
      <!-- Logo -->
      <div
        class="shrink-0 w-full md:w-auto flex justify-center md:justify-start"
      >
        <img
          :src="landingLogo"
          :alt="BRAND.name"
          class="h-[clamp(72px,10vw,120px)] w-auto"
        />
      </div>

      <!-- Nav columns -->
      <div
        class="flex flex-col md:flex-row flex-1 items-center md:items-start justify-center md:justify-start gap-8 md:gap-20 text-[15px] md:text-[16px] leading-8 text-white/70"
      >
        <!-- Tools column -->
        <div class="flex flex-col space-y-1.5 text-center md:text-left">
          <span
            class="text-white/90 font-semibold text-[13px] uppercase tracking-wider mb-2"
          >
            Tools
          </span>
          <router-link
            to="/attribution-gap-calculator"
            class="hover:text-white transition-colors"
          >
            Attribution Gap Calculator
          </router-link>
          <router-link
            to="/direct-mail-roi-calculator"
            class="hover:text-white transition-colors"
          >
            ROI Calculator
          </router-link>
          <router-link
            to="/savings-calculator"
            class="hover:text-white transition-colors"
          >
            Savings Calculator
          </router-link>
        </div>

        <!-- Industries column -->
        <div class="flex flex-col space-y-1.5 text-center md:text-left">
          <span
            class="text-white/90 font-semibold text-[13px] uppercase tracking-wider mb-2"
          >
            Industries
          </span>
          <router-link
            to="/hvac-direct-mail-tracking"
            class="hover:text-white transition-colors"
          >
            HVAC
          </router-link>
          <router-link
            to="/plumbing-direct-mail-tracking"
            class="hover:text-white transition-colors"
          >
            Plumbing
          </router-link>
          <router-link
            to="/real-estate-direct-mail-tracking"
            class="hover:text-white transition-colors"
          >
            Real Estate
          </router-link>
        </div>

        <!-- Company column -->
        <div class="flex flex-col space-y-1.5 text-center md:text-left">
          <span
            class="text-white/90 font-semibold text-[13px] uppercase tracking-wider mb-2"
          >
            Company
          </span>
          <router-link to="/help" class="hover:text-white transition-colors">
            Help Center
          </router-link>
          <router-link to="/terms" class="hover:text-white transition-colors">
            Terms of Service
          </router-link>
          <router-link to="/privacy" class="hover:text-white transition-colors">
            Privacy Policy
          </router-link>
          <a
            :href="getSupportEmailLink()"
            class="hover:text-white transition-colors"
          >
            {{ BRAND.email.support }}
          </a>
        </div>
      </div>

      <!-- Social -->
      <div class="flex flex-col items-center md:items-end gap-4 shrink-0">
        <a
          :href="BRAND.social.linkedin.url"
          target="_blank"
          rel="noreferrer noopener"
          :aria-label="`${BRAND.name} on LinkedIn`"
          class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <img :src="linkedinIcon" alt="" class="h-5 w-5" />
        </a>
      </div>
    </div>

    <!-- Copyright bar -->
    <div class="border-t border-white/10 py-6">
      <p
        class="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16 text-center text-[14px] text-white/50"
      >
        {{ getCopyrightText() }}
      </p>
    </div>
  </footer>
</template>
