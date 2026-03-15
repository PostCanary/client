<!-- src/components/home/HomeCTA.vue -->
<script setup lang="ts">
import SectionWrapper from "@/components/marketing/SectionWrapper.vue";
import CTAButton from "@/components/marketing/CTAButton.vue";
import AnimatedEntry from "@/components/marketing/AnimatedEntry.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

const onSignUp = () => {
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
      <div class="flex flex-col items-center text-center max-w-2xl mx-auto">
        <h2
          class="font-semibold tracking-[-0.03em] text-[28px] sm:text-[38px] xl:text-[46px] leading-tight text-white"
        >
          Stop guessing. Start proving.
        </h2>

        <p class="mt-4 sm:mt-6 text-[16px] sm:text-[18px] leading-relaxed text-white/70">
          See exactly which campaigns, lists, and neighborhoods are driving real revenue.
        </p>

        <div class="mt-8">
          <CTAButton variant="white" size="lg" @click="onSignUp">
            Start Tracking Free
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </CTAButton>
        </div>
      </div>
    </AnimatedEntry>
  </SectionWrapper>
</template>
