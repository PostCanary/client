<!-- src/components/marketing/sections/ClosingCta.vue -->
<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import CTAButton from "@/components/marketing/CTAButton.vue";
import Reveal from "@/components/marketing/Reveal.vue";

const auth = useAuthStore();

function onCta() {
  if (!auth.isAuthenticated) {
    auth.openLoginModal("/app/home", "signup");
    return;
  }
  window.location.href = "/app/home";
}
</script>

<template>
  <section
    class="bg-[var(--pc-navy)] text-white"
    aria-labelledby="closing-cta-heading"
  >
    <div
      class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16 py-20 sm:py-28 text-center"
    >
      <Reveal>
        <h2
          id="closing-cta-heading"
          class="font-bold tracking-[-0.03em] text-[32px] leading-10 sm:text-[48px] sm:leading-[56px] max-w-3xl mx-auto"
        >
          Know exactly what your mail is worth.
        </h2>
        <p
          class="mt-5 text-[16px] sm:text-[18px] leading-relaxed text-white/70 max-w-xl mx-auto"
        >
          Start tracking your next send. No subscription, no minimums — pay per
          postcard and analyze for free.
        </p>
        <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
          <CTAButton size="lg" @click="onCta">Get Started</CTAButton>
          <router-link
            to="/why-postcanary"
            class="text-[15px] font-semibold text-[var(--pc-canary)] hover:underline"
          >
            Why PostCanary →
          </router-link>
        </div>
      </Reveal>
    </div>
  </section>
</template>
