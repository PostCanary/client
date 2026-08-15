<!-- src/components/marketing/sections/EddmSection.vue -->
<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import CTAButton from "@/components/marketing/CTAButton.vue";
import VideoPlaceholder from "@/components/marketing/VideoPlaceholder.vue";
import SectionAccordion from "@/components/marketing/sections/SectionAccordion.vue";
import { MARKETING_FEATURES } from "@/data/marketing";

const auth = useAuthStore();
const feature = MARKETING_FEATURES.find((f) => f.slug === "eddm")!;

// EDDM launch-scope pending (POS-224 flag).
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
    id="eddm"
    class="mkt-anchor-section bg-[var(--mkt-bg-alt)]"
    aria-labelledby="eddm-heading"
    tabindex="-1"
  >
    <div
      class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16 py-16 sm:py-24"
    >
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 lg:items-start">
        <div>
          <h2
            id="eddm-heading"
            class="font-bold tracking-[-0.03em] text-[30px] leading-9 sm:text-[42px] sm:leading-[50px] text-[var(--mkt-text)]"
          >
            {{ feature.title }}
          </h2>
          <p
            class="mt-4 sm:mt-5 text-[16px] sm:text-[18px] leading-relaxed text-[var(--mkt-text-muted)] max-w-xl"
          >
            {{ feature.tagline }}
          </p>
          <div class="mt-8">
            <VideoPlaceholder label="EDDM video placeholder" />
          </div>
        </div>

        <div>
          <SectionAccordion id-prefix="eddm" :items="feature.items" />
          <div class="mt-8 flex flex-wrap items-center gap-4">
            <CTAButton size="lg" @click="onCta">{{ feature.ctaLabel }}</CTAButton>
            <router-link
              to="/features/eddm"
              class="text-[15px] font-semibold text-[var(--pc-teal-brand)] hover:underline"
            >
              Learn more about EDDM →
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
