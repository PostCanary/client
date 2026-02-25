<!-- src/components/home/HomeHowItWorks.vue -->
<script setup lang="ts">
import { Upload, GitMerge, BarChart3 } from "lucide-vue-next";

const steps = [
  {
    number: 1,
    icon: Upload,
    title: "Upload Your Data",
    description: "Drop in your mail list and CRM export. We handle the rest.",
  },
  {
    number: 2,
    icon: GitMerge,
    title: "We Match",
    description:
      "Our engine connects mailers to customers by address—no codes required.",
  },
  {
    number: 3,
    icon: BarChart3,
    title: "You Measure",
    description:
      "See exactly which campaigns drove revenue, down to the dollar.",
  },
];
</script>

<template>
  <section class="bg-[var(--pc-navy-2)] py-24">
    <div
      class="mx-auto max-w-[1660px] 2xl:max-w-[1760px] px-6 md:px-10 xl:px-16"
    >
      <h2
        class="text-center font-normal text-[var(--pc-text)] text-[36px] leading-44px md:text-[48px] md:leading-[58px] xl:text-[70px] xl:leading-80px tracking-[-0.04em]"
      >
        How It Works
      </h2>

      <p
        class="mx-auto mt-6 max-w-[640px] text-center text-[16px] leading-[26px] md:text-[20px] md:leading-8 text-[var(--pc-text-muted)]"
      >
        Three steps. Total clarity.
      </p>

      <div class="mt-16 relative">
        <!-- Connector line (desktop only) -->
        <div
          class="hidden xl:block absolute top-[70px] left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-[var(--pc-cyan)]/30"
        />

        <div class="grid gap-12 md:grid-cols-3 md:gap-8">
          <div
            v-for="step in steps"
            :key="step.number"
            class="flex flex-col items-center text-center relative"
          >
            <div
              class="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[var(--pc-cyan)] text-[var(--pc-navy)] text-sm font-bold flex items-center justify-center z-10"
            >
              {{ step.number }}
            </div>

            <div
              class="w-[140px] h-[140px] rounded-full bg-[var(--pc-card)] border-2 border-[var(--pc-cyan)] flex items-center justify-center shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
            >
              <component :is="step.icon" class="w-14 h-14 text-[var(--pc-cyan)]" />
            </div>

            <h3
              class="mt-8 text-[22px] leading-[30px] md:text-[26px] md:leading-8 font-semibold text-[var(--pc-text)]"
            >
              {{ step.title }}
            </h3>

            <p
              class="mt-3 text-[16px] leading-[26px] text-[var(--pc-text-muted)] max-w-[300px]"
            >
              {{ step.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
