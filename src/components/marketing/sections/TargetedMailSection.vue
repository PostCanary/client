<!-- src/components/marketing/sections/TargetedMailSection.vue -->
<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import CTAButton from "@/components/marketing/CTAButton.vue";
import VideoPlaceholder from "@/components/marketing/VideoPlaceholder.vue";
import SectionAccordion from "@/components/marketing/sections/SectionAccordion.vue";

const auth = useAuthStore();

const items = [
  {
    title: "What is Direct Mail?",
    body: "Direct Mail is targeted mail based on criteria you set for your customer. This could be age, income, sex, home value and other variables that fit your customer profile. This strategy is similar to digital ads that target customers based on specific demographic characteristics. Direct mail pieces are 6\" x 9\" and includes the recipient's name and address on the card.",
  },
  {
    title: "Why use Direct Mail?",
    body: "Direct Mail works best when you know your customer's profile. Using filters you can target your specific customer, skipping those who don't fit your customer profile. Although each piece of mail costs a little more than EDDM (for the targeting data) you end up sending less overall mail as you do not hit every door on a mail route.",
  },
  {
    title: "How does Direct Mail work?",
    body: "Once you've identified what geographic area you want to target you can use a variety of filters to narrow down which households in that area will actually receive your mail. This also allows you to get specific with your offer and call to action.",
  },
];

function onCta() {
  if (!auth.isAuthenticated) {
    auth.openLoginModal("/app/home", "login");
    return;
  }
  window.location.href = "/app/home";
}
</script>

<template>
  <section
    id="targeted-mail"
    class="mkt-anchor-section bg-[var(--mkt-bg)]"
    aria-labelledby="targeted-mail-heading"
  >
    <div
      class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16 py-16 sm:py-24"
    >
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 lg:items-start">
        <div>
          <h2
            id="targeted-mail-heading"
            class="font-bold tracking-[-0.03em] text-[30px] leading-9 sm:text-[42px] sm:leading-[50px] text-[var(--mkt-text)]"
          >
            Targeted Mail
          </h2>
          <p
            class="mt-4 sm:mt-5 text-[16px] sm:text-[18px] leading-relaxed text-[var(--mkt-text-muted)] max-w-xl"
          >
            This strategy is great for targeting residents who match your customer profile.
          </p>
          <div class="mt-8">
            <VideoPlaceholder label="Targeted Mail video placeholder" />
          </div>
        </div>

        <div>
          <SectionAccordion id-prefix="targeted-mail" :items="items" />
          <div class="mt-8">
            <CTAButton size="lg" @click="onCta">Send Mail</CTAButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
