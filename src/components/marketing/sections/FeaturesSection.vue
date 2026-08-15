<!-- src/components/marketing/sections/FeaturesSection.vue -->
<script setup lang="ts">
import { ref } from "vue";

const cards = [
  {
    id: "eddm",
    href: "#eddm",
    title: "EDDM",
    body: "Hit every address on a chosen mail route — regardless of who lives there. Lower price per mailer with high volume of mail sent.",
  },
  {
    id: "targeted-mail",
    href: "#targeted-mail",
    title: "Targeted Mail",
    body: "Hit individual residences based on specific customer demographics. Higher price per mailer with high intent recipients.",
  },
  {
    id: "analytics",
    href: "#analytics",
    title: "Analytics",
    body: "Track every mail send and every conversion to guide your marketing decisions.",
  },
] as const;

// Teal treatment is an interaction state (hover/click), not a static pick.
const activeId = ref<(typeof cards)[number]["id"] | null>(null);

function scrollToSection(event: MouseEvent, href: string, id: (typeof cards)[number]["id"]) {
  event.preventDefault();
  activeId.value = id;
  const target = document.querySelector(href);
  if (!(target instanceof HTMLElement)) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  history.pushState(null, "", href);
}
</script>

<template>
  <section
    id="features"
    class="mkt-anchor-section bg-[var(--mkt-bg)]"
    aria-labelledby="features-heading"
  >
    <!-- Full-width band, per mockup: sits between the hero and Features. -->
    <div class="features-band">
      <p>No Subscription. No Minimums. No Hassle.</p>
    </div>
    <div
      class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16 py-16 sm:py-24"
    >
      <div class="max-w-3xl mx-auto text-center mb-10 sm:mb-14">
        <h2
          id="features-heading"
          class="font-bold tracking-[-0.03em] text-[30px] leading-9 sm:text-[42px] sm:leading-[50px] text-[var(--mkt-text)]"
        >
          Features
        </h2>
        <p
          class="mt-4 sm:mt-5 text-[16px] sm:text-[18px] leading-relaxed text-[var(--mkt-text-muted)]"
        >
          Pay per postcard and analyze for free.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <button
          v-for="card in cards"
          :key="card.id"
          type="button"
          class="feature-card group flex flex-col rounded-[var(--mkt-card-radius)] border px-6 sm:px-7 pt-8 pb-7 text-left cursor-pointer transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--pc-teal-brand)]"
          :class="
            activeId === card.id
              ? 'is-active bg-teal-brand border-teal-brand text-white shadow-[var(--mkt-card-shadow-lg)]'
              : 'bg-[var(--mkt-card)] border-[var(--mkt-border)] text-[var(--mkt-text)] shadow-[var(--mkt-card-shadow)] hover:bg-teal-brand hover:border-teal-brand hover:text-white hover:shadow-[var(--mkt-card-shadow-lg)]'
          "
          :aria-current="activeId === card.id ? 'true' : undefined"
          @click="scrollToSection($event, card.href, card.id)"
        >
          <h3 class="text-[18px] sm:text-[20px] font-semibold leading-snug">
            {{ card.title }}
          </h3>
          <p
            class="mt-2.5 text-[15px] sm:text-[16px] leading-relaxed"
            :class="
              activeId === card.id
                ? 'text-white/90'
                : 'text-[var(--mkt-text-muted)] group-hover:text-white/90'
            "
          >
            {{ card.body }}
          </p>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features-band {
  background: var(--pc-navy);
  color: var(--pc-white);
  text-align: center;
  padding: 1.1rem 1rem;
  font-weight: 700;
  font-size: clamp(1rem, 2.4vw, 1.35rem);
  letter-spacing: 0.01em;
}

@media (prefers-reduced-motion: reduce) {
  .feature-card {
    transition: none;
  }
}
</style>
