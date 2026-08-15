<script setup lang="ts">
import { BRAND, getCopyrightText, getSupportEmailLink } from "@/config/brand";
import landingLogo from "@/assets/postcanary-white.png";
import linkedinIcon from "@/assets/home/linkedin-icon.svg?url";
</script>

<template>
  <footer class="bg-[var(--pc-navy)]">
    <!-- top content row -->
    <div
      class="mx-auto flex w-full max-w-[1660px] 2xl:max-w-[1760px] flex-col md:flex-row items-center md:items-start justify-center md:justify-between gap-10 md:gap-16 px-4 sm:px-6 md:px-10 xl:px-16 2xl:px-20 pt-10 pb-8 md:pt-14 md:pb-10"
    >
      <!-- logo -->
      <div
        class="shrink-0 w-full md:w-auto flex justify-center md:justify-start md:pr-10 lg:pr-16"
      >
        <img :src="landingLogo" :alt="BRAND.name" class="h-[clamp(72px,10vw,144px)] w-auto" />
      </div>

      <!-- middle nav columns -->
      <div
        class="flex flex-col md:flex-row flex-1 items-center md:items-start justify-center md:justify-start gap-6 md:gap-24 text-[16px] md:text-[18px] leading-8 md:leading-10 tracking-[-0.04em] text-[var(--pc-text-muted)] mt-2 md:mt-0"
      >
        <!-- Tools column -->
        <div class="flex flex-col space-y-1 text-center md:text-left">
          <span class="text-[var(--pc-text)] font-semibold text-[14px] uppercase tracking-wider mb-1">Tools</span>
          <router-link
            to="/attribution-gap-calculator"
            class="inline-block pb-0.5 border-b-2 border-transparent hover:border-[var(--pc-cyan)] transition-colors"
          >
            Attribution Gap Calculator
          </router-link>
          <router-link
            to="/direct-mail-roi-calculator"
            class="inline-block pb-0.5 border-b-2 border-transparent hover:border-[var(--pc-cyan)] transition-colors"
          >
            ROI Calculator
          </router-link>
          <router-link
            to="/savings-calculator"
            class="inline-block pb-0.5 border-b-2 border-transparent hover:border-[var(--pc-cyan)] transition-colors"
          >
            Savings Calculator
          </router-link>
        </div>

        <!-- Industries column -->
        <div class="flex flex-col space-y-1 text-center md:text-left">
          <span class="text-[var(--pc-text)] font-semibold text-[14px] uppercase tracking-wider mb-1">Industries</span>
          <router-link
            to="/hvac-direct-mail-tracking"
            class="inline-block pb-0.5 border-b-2 border-transparent hover:border-[var(--pc-cyan)] transition-colors"
          >
            HVAC
          </router-link>
          <router-link
            to="/plumbing-direct-mail-tracking"
            class="inline-block pb-0.5 border-b-2 border-transparent hover:border-[var(--pc-cyan)] transition-colors"
          >
            Plumbing
          </router-link>
          <router-link
            to="/real-estate-direct-mail-tracking"
            class="inline-block pb-0.5 border-b-2 border-transparent hover:border-[var(--pc-cyan)] transition-colors"
          >
            Real Estate
          </router-link>
        </div>
      </div>
      <!-- right contact block -->
      <div
        class="flex flex-col items-center md:items-end gap-4 md:gap-6 shrink-0 mt-2 md:mt-0"
      >
        <router-link
          to="/help"
          class="text-[16px] md:text-[18px] text-[var(--pc-text-muted)] hover:text-[var(--pc-cyan)]"
        >
          Help Center
        </router-link>

        <a
          :href="getSupportEmailLink()"
          class="text-[16px] md:text-[18px] text-[var(--pc-text-muted)] hover:text-[var(--pc-cyan)]"
        >
          {{ BRAND.email.support }}
        </a>

        <a
          :href="BRAND.social.linkedin.url"
          target="_blank"
          rel="noreferrer noopener"
          :aria-label="`${BRAND.name} on LinkedIn`"
        >
          <img :src="linkedinIcon" alt="" class="h-[26px] w-[26px]" />
        </a>
      </div>
    </div>

    <!-- copyright -->
    <div class="pb-6">
      <p
        class="mx-auto max-w-[1660px] 2xl:max-w-[1760px] px-4 sm:px-6 md:px-10 xl:px-16 2xl:px-20 text-center text-[14px] sm:text-[16px] md:text-[18px] text-[var(--pc-text-muted)]"
      >
        {{ getCopyrightText() }}
      </p>
    </div>

    <!-- bottom dark bar -->
    <div class="h-20 w-full bg-[var(--pc-navy-2)]" />
  </footer>
</template>
