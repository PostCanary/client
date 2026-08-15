<!-- src/components/marketing/sections/AnalyticsSection.vue -->
<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { captureEvent } from "@/composables/usePostHog";
import CTAButton from "@/components/marketing/CTAButton.vue";
import VideoPlaceholder from "@/components/marketing/VideoPlaceholder.vue";
import SectionAccordion from "@/components/marketing/sections/SectionAccordion.vue";

const auth = useAuthStore();

const items = [
  {
    title: "Dashboard KPIs",
    body: "The dashboard displays your match rate, revenue from mail, total customers, revenue per mailer, days to convert and much more.",
  },
  {
    title: "Analysis",
    body: "AI reviews the results of your analytics and gives you all of the best insight to set you up for success in your subsequent mail campaigns. Where to target, what deals to run, who to target, how frequently to target and more.",
  },
  {
    title: "Audience",
    body: 'AI reviews your results and breaks down who converted based on a variety of demographics. Where "Analysis" guides you in building a campaign, "Audience" will tell you who to send it to.',
  },
  {
    title: "Heat Map",
    body: "The interactive heat map will show you where exactly your customers are on a map. This can give you visual insight into areas missed, areas saturated or areas to double down in to better guide your next campaign.",
  },
];

function onCta() {
  captureEvent("marketing_cta_clicked", { cta: "track_results", section: "analytics" });
  if (!auth.isAuthenticated) {
    auth.openLoginModal("/app/home", "signup");
    return;
  }
  window.location.href = "/app/home";
}
</script>

<template>
  <section
    id="analytics"
    class="mkt-anchor-section bg-[var(--mkt-bg-alt)]"
    aria-labelledby="analytics-heading"
    tabindex="-1"
  >
    <div
      class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16 py-16 sm:py-24"
    >
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 lg:items-start">
        <div>
          <h2
            id="analytics-heading"
            class="font-bold tracking-[-0.03em] text-[30px] leading-9 sm:text-[42px] sm:leading-[50px] text-[var(--mkt-text)]"
          >
            Analytics
          </h2>
          <p
            class="mt-4 sm:mt-5 text-[16px] sm:text-[18px] leading-relaxed text-[var(--mkt-text-muted)] max-w-xl"
          >
            Our analytics can track every campaign, conversion, attribution and other important KPIs to guide and report on your direct mail performance.
          </p>
          <div class="mt-8">
            <VideoPlaceholder label="Analytics video placeholder" />
          </div>
        </div>

        <div>
          <SectionAccordion id-prefix="analytics" :items="items" />
          <div class="mt-8">
            <CTAButton size="lg" @click="onCta">Track Results</CTAButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
