<!-- src/components/marketing/sections/EddmSection.vue -->
<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import CTAButton from "@/components/marketing/CTAButton.vue";
import VideoPlaceholder from "@/components/marketing/VideoPlaceholder.vue";
import SectionAccordion from "@/components/marketing/sections/SectionAccordion.vue";

const auth = useAuthStore();

const items = [
  {
    title: "What is EDDM?",
    body: 'EDDM stands for "Every Door Direct Mail". This means your mail will go in every mailbox on a particular route(s) regardless of who is living in that home. You may get someone renting an apartment, a single-family homeowner or even a business. EDDM is a 6.25" x 9" mail piece and does not display the recipient\'s name on the mailer but rather something like "current resident" or similar.',
  },
  {
    title: "Why use EDDM?",
    body: "EDDM is a great supplement to Direct Mail. If you aren't yet sure who your customer is, EDDM casts a wide net. If your business is new to the area and you want to introduce yourself to everyone in the neighborhood, or if anyone could be your customer.",
  },
  {
    title: "How does EDDM work?",
    body: "EDDM works by selecting specific mail routes to deliver your mail to. A single zip code can have multiple mail routes. As the postal worker goes through their route they will leave a piece of mail in every resident's mailbox on that route. You don't have to do every route in a ZIP code but can select specific routes within a ZIP code.",
  },
];

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
            EDDM
          </h2>
          <p
            class="mt-4 sm:mt-5 text-[16px] sm:text-[18px] leading-relaxed text-[var(--mkt-text-muted)] max-w-xl"
          >
            This strategy is best when anyone can be your customer.
          </p>
          <div class="mt-8">
            <VideoPlaceholder label="EDDM video placeholder" />
          </div>
        </div>

        <div>
          <SectionAccordion id-prefix="eddm" :items="items" />
          <div class="mt-8">
            <CTAButton size="lg" @click="onCta">Send EDDM</CTAButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
