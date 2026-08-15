<!-- src/pages/features/FeaturePage.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import CTAButton from "@/components/marketing/CTAButton.vue";
import VideoPlaceholder from "@/components/marketing/VideoPlaceholder.vue";
import SectionAccordion from "@/components/marketing/sections/SectionAccordion.vue";
import Reveal from "@/components/marketing/Reveal.vue";
import { getFeatureBySlug } from "@/data/marketing";

const props = defineProps<{
  slug: "eddm" | "targeted-mail" | "analytics";
}>();

const auth = useAuthStore();
const feature = computed(() => getFeatureBySlug(props.slug)!);

function onCta() {
  if (!auth.isAuthenticated) {
    auth.openLoginModal("/app/home", "signup");
    return;
  }
  window.location.href = "/app/home";
}
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="bg-[var(--pc-navy)] text-white" aria-labelledby="feature-heading">
      <div
        class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16 py-20 sm:py-28"
      >
        <Reveal>
          <p
            class="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-canary)] mb-4"
          >
            <router-link to="/" class="hover:underline">PostCanary</router-link>
            <span class="text-white/50"> / Features</span>
          </p>
          <h1
            id="feature-heading"
            class="font-bold tracking-[-0.03em] text-[34px] leading-[40px] sm:text-[52px] sm:leading-[58px] max-w-3xl"
          >
            {{ feature.title }}
          </h1>
          <p
            class="mt-5 text-[17px] sm:text-[19px] leading-relaxed text-white/75 max-w-2xl"
          >
            {{ feature.tagline }}
          </p>
          <div class="mt-9">
            <CTAButton size="lg" @click="onCta">{{ feature.ctaLabel }}</CTAButton>
          </div>
        </Reveal>
      </div>
    </section>

    <!-- Overview + video -->
    <section class="bg-[var(--mkt-bg)]" aria-label="Overview">
      <div
        class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16 py-16 sm:py-24"
      >
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <Reveal>
            <div>
              <h2
                class="font-bold tracking-[-0.02em] text-[26px] sm:text-[32px] text-[var(--mkt-text)]"
              >
                How {{ feature.title }} works
              </h2>
              <p
                class="mt-4 text-[16px] sm:text-[17px] leading-relaxed text-[var(--mkt-text-muted)]"
              >
                {{ feature.items[0]?.body }}
              </p>
            </div>
          </Reveal>
          <Reveal :delay="120">
            <VideoPlaceholder :label="`${feature.title} video placeholder`" />
          </Reveal>
        </div>
      </div>
    </section>

    <!-- Use cases -->
    <section class="bg-[var(--mkt-bg-alt)]" aria-labelledby="use-cases-heading">
      <div
        class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16 py-16 sm:py-24"
      >
        <Reveal>
          <h2
            id="use-cases-heading"
            class="font-bold tracking-[-0.02em] text-[26px] sm:text-[32px] text-[var(--mkt-text)] text-center"
          >
            When to use {{ feature.title }}
          </h2>
        </Reveal>
        <div class="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <Reveal v-for="(uc, i) in feature.useCases" :key="uc.title" :delay="i * 120">
            <div
              class="h-full rounded-[var(--mkt-card-radius)] border border-[var(--mkt-border)] bg-[var(--mkt-card)] p-6 sm:p-7 shadow-[var(--mkt-card-shadow)]"
            >
              <h3 class="text-[18px] font-semibold text-[var(--mkt-text)]">
                {{ uc.title }}
              </h3>
              <p class="mt-2.5 text-[15px] leading-relaxed text-[var(--mkt-text-muted)]">
                {{ uc.body }}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>

    <!-- FAQ accordion (shared copy) -->
    <section class="bg-[var(--mkt-bg)]" aria-labelledby="faq-heading">
      <div
        class="mx-auto w-full max-w-[900px] px-4 sm:px-6 md:px-10 xl:px-16 py-16 sm:py-24"
      >
        <Reveal>
          <h2
            id="faq-heading"
            class="font-bold tracking-[-0.02em] text-[26px] sm:text-[32px] text-[var(--mkt-text)] text-center mb-8"
          >
            {{ feature.title }} FAQ
          </h2>
        </Reveal>
        <SectionAccordion :id-prefix="`feature-${feature.slug}`" :items="feature.items" />
        <div class="mt-10 text-center">
          <CTAButton size="lg" @click="onCta">{{ feature.ctaLabel }}</CTAButton>
        </div>
      </div>
    </section>
  </div>
</template>
