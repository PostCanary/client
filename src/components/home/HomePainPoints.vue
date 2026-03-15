<!-- src/components/home/HomePainPoints.vue -->
<script setup lang="ts">
import qrIcon from "@/assets/home/qr-code-icon.svg?url";
import wastedAdIcon from "@/assets/home/cash-burn-icon.svg?url";
import spreadsheetsIcon from "@/assets/home/spreadsheet-icon.svg?url";
import noAttributionIcon from "@/assets/home/network-icon.svg?url";
import SectionWrapper from "@/components/marketing/SectionWrapper.vue";
import SectionHeading from "@/components/marketing/SectionHeading.vue";
import AnimatedEntry from "@/components/marketing/AnimatedEntry.vue";

const painCards = [
  {
    icon: qrIcon,
    title: "Codes only capture a fraction of conversions",
    body: "Someone gets your mailer, Googles you two weeks later, and books. QR codes and promo codes never see that. PostCanary does.",
  },
  {
    icon: wastedAdIcon,
    title: "You're spending without knowing what's working",
    body: "Every campaign is an investment. Without accurate attribution, you can't tell which lists, neighborhoods, or offers are pulling their weight.",
  },
  {
    icon: noAttributionIcon,
    title: "Online conversions go unconnected",
    body: "A recipient visits your site, fills out a form, or makes a purchase, but nothing ties it back to the mailer that started it. PostCanary connects the two automatically.",
  },
  {
    icon: spreadsheetsIcon,
    title: "Manual reporting eats your time",
    body: "Exporting data into spreadsheets every month is slow, messy, and error-prone. PostCanary replaces all of that with a live dashboard.",
  },
];
</script>

<template>
  <SectionWrapper bg="alt">
    <SectionHeading
      heading="The attribution gap is costing you."
      subheading="Most direct mail tracking relies on customers scanning a code or typing in a URL. Most customers don't. Here's what that means for your campaigns."
    />

    <div class="grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-4">
      <AnimatedEntry
        v-for="(card, i) in painCards"
        :key="card.title"
        :delay="i * 100"
      >
        <article
          class="flex h-full flex-col items-center text-center rounded-[var(--mkt-card-radius)] border border-[var(--mkt-border)] bg-[var(--mkt-card)] px-6 sm:px-8 pt-10 pb-8 shadow-[var(--mkt-card-shadow)] hover:shadow-[var(--mkt-card-shadow-lg)] transition-shadow duration-300"
        >
          <!-- Icon circle -->
          <div
            class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--mkt-teal)]/10"
          >
            <img
              :src="card.icon"
              alt=""
              class="h-10 w-10 object-contain"
            />
          </div>

          <h3
            class="text-[18px] sm:text-[20px] leading-snug font-semibold text-[var(--mkt-text)]"
          >
            {{ card.title }}
          </h3>

          <p
            class="mt-3 text-[15px] sm:text-[16px] leading-relaxed text-[var(--mkt-text-muted)]"
          >
            {{ card.body }}
          </p>
        </article>
      </AnimatedEntry>
    </div>
  </SectionWrapper>
</template>
