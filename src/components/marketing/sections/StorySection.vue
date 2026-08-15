<!-- src/components/marketing/sections/StorySection.vue -->
<script setup lang="ts">
import { Mail, Mailbox, MapPinned, TrendingUp } from "lucide-vue-next";
import ScrollStory, {
  type StoryStep,
} from "@/components/marketing/ScrollStory.vue";
import Reveal from "@/components/marketing/Reveal.vue";

const steps: StoryStep[] = [
  {
    id: "send",
    kicker: "01 — Send",
    title: "You send the mail",
    body: "EDDM or Targeted Mail, PostCanary prints and delivers your piece to the routes or households you choose. Every send is recorded the moment it leaves.",
    icon: Mail,
  },
  {
    id: "delivered",
    kicker: "02 — Delivered",
    title: "It lands in mailboxes",
    body: "Your mail reaches real doors. No QR code, no scan required — we know exactly which addresses received which piece, and when.",
    icon: Mailbox,
  },
  {
    id: "matched",
    kicker: "03 — Matched",
    title: "We match every response",
    body: "Upload your sales, bookings, or leads. PostCanary matches each conversion back to the exact address and mailer that drove it — capturing the 70–90% of responses QR codes miss.",
    icon: MapPinned,
  },
  {
    id: "revenue",
    kicker: "04 — Revenue",
    title: "You see real ROI",
    body: "Match rate, revenue per mailer, days to convert — all on one dashboard. Know which campaigns paid off and where to send the next one.",
    icon: TrendingUp,
  },
];
</script>

<template>
  <section
    id="how-it-works"
    class="mkt-anchor-section bg-[var(--mkt-bg)]"
    aria-labelledby="story-heading"
    tabindex="-1"
  >
    <div
      class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16 py-16 sm:py-24"
    >
      <Reveal>
        <div class="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <h2
            id="story-heading"
            class="font-bold tracking-[-0.03em] text-[30px] leading-9 sm:text-[42px] sm:leading-[50px] text-[var(--mkt-text)]"
          >
            From mailbox to revenue, every step tracked
          </h2>
          <p
            class="mt-4 sm:mt-5 text-[16px] sm:text-[18px] leading-relaxed text-[var(--mkt-text-muted)]"
          >
            Direct mail works. Proving it used to be the hard part.
          </p>
        </div>
      </Reveal>

      <ScrollStory :steps="steps" />
    </div>
  </section>
</template>
