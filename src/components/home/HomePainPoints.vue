<script setup lang="ts">
import qrIcon from "@/assets/home/qr-code-icon.svg?url";
import wastedAdIcon from "@/assets/home/cash-burn-icon.svg?url";
import spreadsheetsIcon from "@/assets/home/spreadsheet-icon.svg?url";
import noAttributionIcon from "@/assets/home/network-icon.svg?url";
import { BRAND } from "@/config/brand";

const painCards = [
  {
    icon: qrIcon,
    alt: "QR code pain point",
    title: "Relying On QR Codes & Call-Tracking Alone",
    body: `Only a fraction of conversions get tracked — ${BRAND.name} connects the rest.`,
  },
  {
    icon: wastedAdIcon,
    alt: "Wasted ad spend icon",
    title: "Wasted Ad Spend",
    body: `Thousands of mailers go out — but there's no insight on how they performed. ${BRAND.name} shows real ROI and CPA.`,
  },
  {
    icon: noAttributionIcon,
    alt: "No attribution icon",
    title: "No Attribution For Web Or Walk-In Customers",
    body: `${BRAND.name} links offline and online conversions automatically.`,
  },
  {
    icon: spreadsheetsIcon,
    alt: "Data stuck in spreadsheets icon",
    title: "Data Stuck In Spreadsheets",
    body: `Manual reports kill momentum and accuracy — ${BRAND.name} makes measurement effortless.`,
  },
];
</script>

<template>
  <section class="bg-[var(--pc-navy)] py-24">
    <div
      class="mx-auto max-w-[1660px] 2xl:max-w-[1760px] px-6 md:px-10 xl:px-16"
    >
      <!-- Heading -->
      <h2
        class="text-center font-normal text-[var(--pc-text)] text-[36px] leading-44px md:text-[48px] md:leading-[58px] xl:text-[70px] xl:leading-80px tracking-[-0.04em]"
      >
        Recognize These Challenges?
      </h2>

      <!-- Subheading -->
      <p
        class="mx-auto mt-6 max-w-[640px] text-center text-[16px] leading-[26px] md:text-[20px] md:leading-28px text-[var(--pc-text-muted)]"
      >
        You’re not the only one wondering where your mail marketing data
        disappears to. See how {{ BRAND.name }} brings it all back in view.
      </p>

      <!-- Cards -->
      <div class="mt-14 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="card in painCards"
          :key="card.title"
          class="flex flex-col items-center rounded-[14px] border border-[var(--pc-border)] bg-[var(--pc-card)] px-8 pt-12 pb-10 shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
        >
          <!-- Icon circle -->
          <div
            class="mb-8 flex h-[139px] w-[139px] items-center justify-center rounded-full bg-[var(--pc-cyan)]"
          >
            <img
              :src="card.icon"
              :alt="card.alt"
              class="h-[72px] w-[72px] object-contain"
            />
          </div>

          <!-- Title -->
          <h3
            class="text-center text-[22px] leading-[30px] md:text-[24px] md:leading-32px lg:text-[30px] lg:leading-36px font-semibold text-[var(--pc-text)]"
          >
            {{ card.title }}
          </h3>

          <!-- Body -->
          <p
            class="mt-4 text-center text-[16px] leading-[26px] text-[var(--pc-text-muted)]"
          >
            {{ card.body }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
