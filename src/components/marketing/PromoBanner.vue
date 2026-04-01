<!-- src/components/marketing/PromoBanner.vue -->
<script setup lang="ts">
import SectionWrapper from "@/components/marketing/SectionWrapper.vue";
import CTAButton from "@/components/marketing/CTAButton.vue";
import AnimatedEntry from "@/components/marketing/AnimatedEntry.vue";
import { useAuthStore } from "@/stores/auth";

withDefaults(
  defineProps<{
    badge?: string;
    headline: string;
    body: string;
    ctaLabel?: string;
  }>(),
  {
    badge: undefined,
    ctaLabel: "Start Tracking Free",
  },
);

const auth = useAuthStore();

const onCTA = () => {
  if (!auth.isAuthenticated) {
    auth.openLoginModal("/dashboard", "signup");
    return;
  }
  window.location.href = "/dashboard";
};
</script>

<template>
  <SectionWrapper bg="navy">
    <AnimatedEntry>
      <div class="flex flex-col items-center text-center max-w-2xl mx-auto py-2 sm:py-4">
        <span
          v-if="badge"
          class="inline-block rounded-full bg-[var(--mkt-teal)] px-4 py-1 text-[13px] font-semibold uppercase tracking-wider text-white mb-4"
        >
          {{ badge }}
        </span>

        <h2
          class="font-semibold tracking-[-0.03em] text-[24px] sm:text-[32px] xl:text-[40px] leading-tight text-white"
        >
          {{ headline }}
        </h2>

        <p class="mt-3 sm:mt-4 text-[15px] sm:text-[17px] leading-relaxed text-white/70">
          {{ body }}
        </p>

        <div class="mt-6 sm:mt-8">
          <CTAButton variant="white" size="lg" @click="onCTA">
            {{ ctaLabel }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </CTAButton>
        </div>
      </div>
    </AnimatedEntry>
  </SectionWrapper>
</template>
